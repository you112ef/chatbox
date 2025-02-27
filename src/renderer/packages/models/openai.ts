import { Message, MessageToolCalls } from 'src/shared/types'
import { ApiError, ChatboxAIAPIError } from './errors'
import  { onResultChange } from './base'
import storage from '@/storage'
import * as settingActions from '@/stores/settingActions'
import { normalizeOpenAIApiHostAndPath } from './llm_utils'
import { webSearchTool } from '../web-search'
import OpenAIBase from './openai-base'
import { last } from 'lodash'

interface Options {
    openaiKey: string
    apiHost: string
    apiPath?: string
    model: OpenAIModel | 'custom-model'
    dalleStyle: 'vivid' | 'natural'
    openaiCustomModel?: string // OpenAI 自定义模型的 ID
    // openaiMaxTokens: number
    temperature: number
    topP?: number
    injectDefaultMetadata: boolean
    openaiUseProxy: boolean
}

export default class OpenAI extends OpenAIBase {
    public name = 'OpenAI'
    
    public options: Options
    constructor(options: Options) {
        super()
        this.options = options
        const { apiHost, apiPath } = normalizeOpenAIApiHostAndPath(this.options)
        this.options.apiHost = apiHost
        this.options.apiPath = apiPath
    }
    
    protected get webSearchModel(): string {
        return this.options.openaiCustomModel ?? this.options.model
    }
    
    async callChatCompletion(
        rawMessages: Message[],
        signal?: AbortSignal,
        onResultChange?: onResultChange,
        options?: {
            webBrowsing?: boolean
        }
    ): Promise<string> {
        try {
            return await this._callChatCompletion(rawMessages, signal, onResultChange, options)
        } catch (e) {
            // 如果当前模型不支持图片输入，抛出对应的错误
            if (
                e instanceof ApiError &&
                e.message.includes('Invalid content type. image_url is only supported by certain models.')
            ) {
                // 根据当前 IP，判断是否在错误中推荐 Chatbox AI 4
                const remoteConfig = settingActions.getRemoteConfig()
                if (remoteConfig.setting_chatboxai_first) {
                    throw ChatboxAIAPIError.fromCodeName('model_not_support_image', 'model_not_support_image')
                } else {
                    throw ChatboxAIAPIError.fromCodeName('model_not_support_image', 'model_not_support_image_2')
                }
            }
            throw e
        }
    }

    async _callChatCompletion(
        rawMessages: Message[],
        signal?: AbortSignal,
        onResultChange?: onResultChange,
        options?: {
            webBrowsing?: boolean
        }
    ): Promise<string> {
        const model = this.options.model === 'custom-model' ? this.options.openaiCustomModel || '' : this.options.model
        if (this.options.injectDefaultMetadata) {
            rawMessages = injectModelSystemPrompt(model, rawMessages)
        }
        if (isOSeriesModel(model)) {
            const messages = await populateOSeriesMessage(rawMessages, model)
            return this.requestChatCompletionsNotStream({ model, messages }, signal, onResultChange)
        }
        const messages = await populateGPTMessage(rawMessages, this.options.model)
        const requestBody = {
            messages,
            model,
            // vision 模型的默认 max_tokens 极低，基本很难回答完整，因此手动设置为模型最大值
            max_tokens:
                this.options.model === 'gpt-4-vision-preview'
                    ? openaiModelConfigs['gpt-4-vision-preview'].maxTokens
                    : undefined,
            temperature: this.options.temperature,
            top_p: this.options.topP,
            stream: true,
            tools: options?.webBrowsing ? [webSearchTool]: undefined
        }
        const proceed = () => this.requestChatCompletionsStream(
            requestBody,
            signal,
            onResultChange
        )

        if (!options?.webBrowsing || this.isSupportToolUse(this.options.model)){
            return proceed()
        }
        
        // model do not support tool use, construct query then provide results to model
        requestBody.tools = undefined
        const { query, searchResults } = await this.doSearch(messages, signal) ?? {}
        if(!searchResults) {
            return proceed()
        }
        onResultChange?.({ webBrowsing: {
            query: query!.split(' '),
            links: searchResults.map(it => {
                return {
                    title: it.title,
                    url: it.link,
                }
            })
        }})
        requestBody.messages = this.constructInfoForSearchResult(messages!, searchResults)
        return proceed()
    }

    async requestChatCompletionsStream(
        requestBody: Record<string, any>,
        signal?: AbortSignal,
        onResultChange?: onResultChange
    ): Promise<string> {
        const response = await this.post(`${this.options.apiHost}${this.options.apiPath}`, this.getHeaders(), requestBody, {
            signal,
            useProxy: this.options.openaiUseProxy,
        })
        let result = ''
        let reasoningContent = ''
        const finalToolCalls: MessageToolCalls = {}
        await this.handleSSE(response, (message) => {
            if (message === '[DONE]') {                
                return
            }
           const data = JSON.parse(message)
            if (data.error) {
                throw new ApiError(`Error from ${this.name}: ${JSON.stringify(data)}`)
            }

            // model decide to use tools
            if (data.choices[0]?.delta?.tool_calls) {
                const toolCalls = data.choices[0].delta.tool_calls || []
                for (const toolCall of toolCalls) {
                    const { index } = toolCall

                    if (!finalToolCalls[index]) {
                        finalToolCalls[index] = toolCall
                    }

                    finalToolCalls[index].function.arguments += toolCall.function.arguments
                }
                if (onResultChange) {
                    onResultChange({ content: result, reasoningContent, toolCalls: finalToolCalls })
                }
            }

            const part = data.choices[0]?.delta?.content
            if (typeof part === 'string') {
                result += part
                if (onResultChange) {
                    onResultChange({ content: result, reasoningContent, toolCalls: finalToolCalls  })
                }
            }
            // 支持 deepseek r1 的思考链
            const reasoningContentPart = data.choices[0]?.delta?.reasoning_content
            if (typeof reasoningContentPart === 'string') {
                if (!reasoningContent) {
                    reasoningContent = ''
                }
                reasoningContent += reasoningContentPart
                if (onResultChange) {
                    onResultChange({ content: result, reasoningContent, toolCalls: finalToolCalls  })
                }
            }
            // 处理一些本地部署或三方的 deepseek-r1 返回中的 <think>...</think> 思考链
            if (
                !reasoningContent
                && this.options.model.includes('deepseek-r')
                && result.includes('<think>') && result.includes('</think>')
            ) {
                const index = result.lastIndexOf('</think>')
                reasoningContent = result.slice(0, index + 8)
                result = result.slice(index + 8)
            }
            if (onResultChange) {
                onResultChange({ content: result, reasoningContent, toolCalls: finalToolCalls  })
            }
        })
        return result
    }

    async requestChatCompletionsNotStream(
        requestBody: Record<string, any>,
        signal?: AbortSignal,
        onResultChange?: onResultChange
    ): Promise<string> {
        const response = await this.post(`${this.options.apiHost}${this.options.apiPath}`, this.getHeaders(), requestBody, {
            signal,
            useProxy: this.options.openaiUseProxy,
        })
        const json = await response.json()
        if (json.error) {
            throw new ApiError(`Error from OpenAI: ${JSON.stringify(json)}`)
        }
        const content: string = json.choices[0].message.content || ''
        if (onResultChange) {
            onResultChange({ content })
        }
        return content
    }

    async callImageGeneration(prompt: string, signal?: AbortSignal): Promise<string> {
        const res = await this.post(
            `${this.options.apiHost}/images/generations`,
            this.getHeaders(),
            {
                prompt,
                response_format: 'b64_json',
                model: 'dall-e-3',
                style: this.options.dalleStyle,
            },
            { signal }
        )
        const json = await res.json()
        return json['data'][0]['b64_json']
    }

    getHeaders() {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.options.openaiKey}`,
            'Content-Type': 'application/json',
        }
        if (this.options.apiHost.includes('openrouter.ai')) {
            // 希望可以得到 https://openrouter.ai/ 的排名
            headers['HTTP-Referer'] = 'https://chatboxai.app'
            headers['X-Title'] = 'Chatbox AI'
        }
        return headers
    }

    static isSupportVision(model: OpenAIModel | 'custom-model' | string): boolean {
        return isSupportVision(model)
    }

    isSupportToolUse (model: string) {
        return this.options.model !== 'custom-model'
    }
}

// Ref: https://platform.openai.com/docs/models/gpt-4
export const openaiModelConfigs = {
    'gpt-3.5-turbo': {
        maxTokens: 4096, // 模型支持最大的token数
        maxContextTokens: 16_385,
        vision: false,
    },
    'gpt-3.5-turbo-16k': {
        maxTokens: 4096,
        maxContextTokens: 16_385,
        vision: false,
    },
    'gpt-3.5-turbo-1106': {
        maxTokens: 4096,
        maxContextTokens: 16_385,
        vision: false,
    },
    'gpt-3.5-turbo-0125': {
        maxTokens: 4096,
        maxContextTokens: 16_385,
        vision: false,
    },
    'gpt-3.5-turbo-0613': {
        maxTokens: 4096,
        maxContextTokens: 4_096,
        vision: false,
    },
    'gpt-3.5-turbo-16k-0613': {
        maxTokens: 4096,
        maxContextTokens: 16_385,
        vision: false,
    },

    'gpt-4o-mini': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
        vision: true,
    },
    'gpt-4o-mini-2024-07-18': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
        vision: true,
    },

    'gpt-4o': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
        vision: true,
    },
    'gpt-4o-2024-05-13': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
        vision: true,
    },
    'gpt-4o-2024-08-06': {
        maxTokens: 16_384,
        maxContextTokens: 128_000,
        vision: true,
    },
    'gpt-4o-2024-11-20': {
        maxTokens: 16_384,
        maxContextTokens: 128_000,
        vision: true,
    },
    'chatgpt-4o-latest': {
        maxTokens: 16_384,
        maxContextTokens: 128_000,
        vision: true,
    },

    'gpt-4': {
        maxTokens: 4_096,
        maxContextTokens: 8_192,
        vision: false,
    },
    'gpt-4-turbo': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
        vision: true,
    },
    'gpt-4-turbo-2024-04-09': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
        vision: true,
    },
    'gpt-4-0613': {
        maxTokens: 4_096,
        maxContextTokens: 8_192,
        vision: false,
    },
    'gpt-4-32k': {
        maxTokens: 4_096,
        maxContextTokens: 32_768,
        vision: false,
    },
    'gpt-4-32k-0613': {
        maxTokens: 4_096,
        maxContextTokens: 32_768,
        vision: false,
    },
    'gpt-4-1106-preview': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
        vision: false,
    },
    'gpt-4-0125-preview': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
        vision: false,
    },
    'gpt-4-turbo-preview': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
        vision: false,
    },
    'gpt-4-vision-preview': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
        vision: true,
    },

    'o1': {
        maxTokens: 32_768,
        maxContextTokens: 128_000,
        vision: true,
    },
    'o1-2024-12-17': {
        maxTokens: 32_768,
        maxContextTokens: 128_000,
        vision: true,
    },
    'o1-preview': {
        maxTokens: 32_768,
        maxContextTokens: 128_000,
        vision: false,
    },
    'o1-preview-2024-09-12': {
        maxTokens: 32_768,
        maxContextTokens: 128_000,
        vision: false,
    },
    'o1-mini': {
        maxTokens: 65_536,
        maxContextTokens: 128_000,
        vision: false,
    },
    'o1-mini-2024-09-12': {
        maxTokens: 65_536,
        maxContextTokens: 128_000,
        vision: false,
    },
    'o3-mini': {
        maxTokens: 100_000,
        maxContextTokens: 200_000,
        vision: false,
    },
    'o3-mini-2025-01-31': {
        maxTokens: 100_000,
        maxContextTokens: 200_000,
        vision: false,
    },
}

export type OpenAIModel = keyof typeof openaiModelConfigs
export const models = Array.from(Object.keys(openaiModelConfigs)).sort() as OpenAIModel[]

export function isOSeriesModel(model: string): boolean {
    return /o\d+/.test(model)
}

export function isSupportVision(model: OpenAIModel | 'custom-model' | string): boolean {
    // 因为历史原因，有些用户会在 openai 提供商的设置中使用其他厂商的模型
    return (
        model === 'custom-model' ||
        (openaiModelConfigs[model as OpenAIModel] && openaiModelConfigs[model as OpenAIModel].vision)
    )
}

export async function populateGPTMessage(
    rawMessages: Message[],
    model: OpenAIModel | 'custom-model'
): Promise<OpenAIMessage[] | OpenAIMessageVision[]> {
    if (isSupportVision(model) && rawMessages.some((m) => m.pictures && m.pictures.length > 0)) {
        return populateOpenAIMessageVision(rawMessages)
    } else {
        return populateOpenAIMessageText(rawMessages)
    }
}

export async function populateOSeriesMessage(rawMessages: Message[], model: string): Promise<OpenAIMessage[] | OpenAIMessageVision[]> {
    let messages = isSupportVision(model) && rawMessages.some((m) => m.pictures && m.pictures.length > 0)
        ? await populateOpenAIMessageVision(rawMessages)
        : await populateOpenAIMessageText(rawMessages)
    for (const [i, m] of messages.entries()) {
        if (messages[i].role === 'system') {
            messages[i].role = 'user'
        }
    }
    return messages
}

export async function populateOpenAIMessageText(rawMessages: Message[]): Promise<OpenAIMessage[]> {
    const messages: OpenAIMessage[] = rawMessages.map((m) => ({
        id: m.id,
        tool_call_id: m.role === 'tool' ? m.id : undefined,
        role: m.role,
        content: m.content,
        tool_calls: m.toolCalls && Object.values(m.toolCalls)
    }))
    return messages
}

export async function populateOpenAIMessageVision(rawMessages: Message[]): Promise<OpenAIMessageVision[]> {
    const messages: OpenAIMessageVision[] = []
    for (const m of rawMessages) {
        const content: OpenAIMessageVision['content'] = [{ type: 'text', text: m.content }]
        for (const pic of m.pictures || []) {
            if (!pic.storageKey) {
                continue
            }
            const picBase64 = await storage.getBlob(pic.storageKey)
            if (!picBase64) {
                continue
            }
            content.push({
                type: 'image_url',
                image_url: { url: picBase64 },
            })
        }
        messages.push({ role: m.role, content } as OpenAIMessageVision)
    }
    return messages
}

/**
 * 在 system prompt 中注入模型信息
 * @param model
 * @param messages
 * @returns
 */
export function injectModelSystemPrompt(model: string, messages: Message[]) {
    const metadataPrompt = `
Current model: ${model}
Current date: ${new Date().toISOString()}

`
    let hasInjected = false
    return messages.map((m) => {
        if (m.role === 'system' && !hasInjected) {
            m = { ...m } // 复制，防止原始数据在其他地方被直接渲染使用
            m.content = metadataPrompt + m.content
            hasInjected = true
        }
        return m
    })
}

// OpenAIMessage OpenAI API 消息类型。（对于业务追加的字段，应该放到 Message 中）
export interface OpenAIMessage {
    id: string
    role: 'system' | 'user' | 'assistant' | 'tool'
    content: string
    name?: string
}

// vision 版本的 OpenAI 消息类型
export interface OpenAIMessageVision {
    id: string
    role: 'system' | 'user' | 'assistant' | 'tool'
    content: string | (
        | {
              type: 'text'
              text: string
          }
        | {
              type: 'image_url'
              image_url: {
                  // 可以是 url，也可以是 base64
                  // data:image/jpeg;base64,{base64_image}
                  url: string
                  detail?: 'auto' | 'low' | 'high' // default: auto
              }
          }
    )[]
}
