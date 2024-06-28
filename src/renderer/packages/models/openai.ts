import { Message } from 'src/shared/types'
import { ApiError, ChatboxAIAPIError } from './errors'
import Base, { onResultChange } from './base'
import storage from '@/storage'
import * as settingActions from '@/stores/settingActions'

interface Options {
    openaiKey: string
    apiHost: string
    apiPath?: string
    model: Model | 'custom-model'
    dalleStyle: 'vivid' | 'natural'
    openaiCustomModel?: string // OpenAI 自定义模型的 ID
    // openaiMaxTokens: number
    temperature: number
    topP?: number
    injectDefaultMetadata: boolean
}

export default class OpenAI extends Base {
    public name = 'OpenAI'

    public options: Options
    constructor(options: Options) {
        super()
        this.options = options
        if (this.options.apiHost && this.options.apiHost.trim().length === 0) {
            this.options.apiHost = 'https://api.openai.com'
        }
        if (this.options.apiHost && this.options.apiHost.startsWith('https://openrouter.ai/api/v1')) {
            this.options.apiHost = 'https://openrouter.ai/api'
        }
        if (this.options.apiPath && !this.options.apiPath.startsWith('/')) {
            this.options.apiPath = '/' + this.options.apiPath
        }
    }

    async callChatCompletion(rawMessages: Message[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        try {
            return await this._callChatCompletion(rawMessages, signal, onResultChange)
        } catch (e) {
            // 如果当前模型不支持图片输入，抛出对应的错误
            if (e instanceof ApiError && e.message.includes('Invalid content type. image_url is only supported by certain models.')) {
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

    async _callChatCompletion(rawMessages: Message[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        let messages = await populateOpenAIMessage(rawMessages, this.options.model)

        const model = this.options.model === 'custom-model'
            ? this.options.openaiCustomModel || ''
            : this.options.model

        if (this.options.injectDefaultMetadata) {
            messages = injectModelSystemPrompt(model, messages)
        }

        const apiPath = this.options.apiPath || '/v1/chat/completions'
        const response = await this.post(
            `${this.options.apiHost}${apiPath}`,
            this.getHeaders(),
            {
                messages,
                model,
                // vision 模型的默认 max_tokens 极低，基本很难回答完整，因此手动设置为模型最大值
                max_tokens: this.options.model === 'gpt-4-vision-preview'
                    ? openaiModelConfigs['gpt-4-vision-preview'].maxTokens
                    : undefined,
                temperature: this.options.temperature,
                top_p: this.options.topP,
                stream: true,
            },
            signal
        )
        let result = ''
        await this.handleSSE(response, (message) => {
            if (message === '[DONE]') {
                return
            }
            const data = JSON.parse(message)
            if (data.error) {
                throw new ApiError(`Error from OpenAI: ${JSON.stringify(data)}`)
            }
            const text = data.choices[0]?.delta?.content
            if (text !== undefined) {
                result += text
                if (onResultChange) {
                    onResultChange(result)
                }
            }
        })
        return result
    }

    async callImageGeneration(prompt: string, signal?: AbortSignal): Promise<string> {
        if (this.options.apiHost.endsWith('/')) {
            this.options.apiHost = this.options.apiHost.slice(0, -1)
        }
        const res = await this.post(
            `${this.options.apiHost}/v1/images/generations`,
            this.getHeaders(),
            {
                prompt,
                response_format: 'b64_json',
                model: 'dall-e-3',
                style: this.options.dalleStyle,
            },
            signal
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
            headers['HTTP-Referer'] = 'https://localhost:3000/' // 支持 OpenRouter，需要设置这个表头才能正常工作
        }
        return headers
    }

    static isSupportVision(model: Model | 'custom-model'): boolean {
        return isSupportVision(model)
    }
}

// Ref: https://platform.openai.com/docs/models/gpt-4
export const openaiModelConfigs = {
    'gpt-3.5-turbo': {
        maxTokens: 4096, // 模型支持最大的token数
        maxContextTokens: 16_385,
    },
    'gpt-3.5-turbo-16k': {
        maxTokens: 4096,
        maxContextTokens: 16_385,
    },
    'gpt-3.5-turbo-1106': {
        maxTokens: 4096,
        maxContextTokens: 16_385,
    },
    'gpt-3.5-turbo-0125': {
        maxTokens: 4096,
        maxContextTokens: 16_385,
    },
    'gpt-3.5-turbo-0613': {
        maxTokens: 4096,
        maxContextTokens: 4_096,
    },
    'gpt-3.5-turbo-16k-0613': {
        maxTokens: 4096,
        maxContextTokens: 16_385,
    },

    'gpt-4o': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
    },
    'gpt-4o-2024-05-13': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
    },

    'gpt-4': {
        maxTokens: 4_096,
        maxContextTokens: 8_192,
    },
    'gpt-4-turbo': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
    },
    'gpt-4-0613': {
        maxTokens: 4_096,
        maxContextTokens: 8_192,
    },
    'gpt-4-32k': {
        maxTokens: 4_096,
        maxContextTokens: 32_768,
    },
    'gpt-4-32k-0613': {
        maxTokens: 4_096,
        maxContextTokens: 32_768,
    },
    'gpt-4-1106-preview': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
    },
    'gpt-4-0125-preview': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
    },
    'gpt-4-turbo-preview': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
    },
    'gpt-4-vision-preview': {
        maxTokens: 4_096,
        maxContextTokens: 128_000,
    },

    // 以下模型延长到了 2024 年 6 月
    // https://platform.openai.com/docs/models/continuous-model-upgrades
    'gpt-3.5-turbo-0301': {
        maxTokens: 4096,
        maxContextTokens: 4096,
    },
    'gpt-4-0314': {
        maxTokens: 4096,
        maxContextTokens: 8192,
    },
    'gpt-4-32k-0314': {
        maxTokens: 4096,
        maxContextTokens: 32768,
    },
}
export type Model = keyof typeof openaiModelConfigs
export const models = Array.from(Object.keys(openaiModelConfigs)).sort() as Model[]

export function isSupportVision(model: Model | 'custom-model'): boolean {
    return [
        'gpt-4-turbo',
        'gpt-4-vision-preview',
        'gpt-4o',
        'gpt-4o-2024-05-13',
        'custom-model',
    ].includes(model)
}

export async function populateOpenAIMessage(rawMessages: Message[], model: Model | 'custom-model'): Promise<OpenAIMessage[] | OpenAIMessageVision[]> {
    if (isSupportVision(model) && rawMessages.some((m) => m.pictures && m.pictures.length > 0)) {
        return populateOpenAIMessageVision(rawMessages)
    } else {
        return populateOpenAIMessageText(rawMessages)
    }
}

export async function populateOpenAIMessageText(rawMessages: Message[]): Promise<OpenAIMessage[]> {
    const messages: OpenAIMessage[] = rawMessages.map((m) => ({
        role: m.role,
        content: m.content,
    }))
    return messages
}

export async function populateOpenAIMessageVision(rawMessages: Message[]): Promise<OpenAIMessageVision[]> {
    const messages: OpenAIMessageVision[] = []
    for (const m of rawMessages) {
        const content: OpenAIMessageVision['content'] = [
            { type: 'text', text: m.content }
        ]
        for (const pic of (m.pictures || [])) {
            if (!pic.storageKey) {
                continue
            }
            const picBase64 = await storage.getBlob(pic.storageKey)
            if (!picBase64) {
                continue
            }
            content.push({
                type: 'image_url',
                image_url: { url: picBase64 }
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
export function injectModelSystemPrompt(model: string, messages: OpenAIMessage[] | OpenAIMessageVision[]) {
    const metadataPrompt = `
Current model: ${model}
Current date: ${new Date().toISOString()}

`
    for (const message of messages) {
        if (message.role === 'system') {
            if (typeof message.content == 'string') {
                message.content = metadataPrompt + message.content
            } else if (typeof message.content == 'object') {
                for (const content of message.content) {
                    if (content.type === 'text') {
                        content.text = metadataPrompt + content.text
                        break
                    }
                }
            }
            break
        }
    }
    return messages
}

// OpenAIMessage OpenAI API 消息类型。（对于业务追加的字段，应该放到 Message 中）
export interface OpenAIMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
    name?: string
}

// vision 版本的 OpenAI 消息类型
export interface OpenAIMessageVision {
    role: 'system' | 'user' | 'assistant'
    content: (
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
