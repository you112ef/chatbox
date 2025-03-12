import { Message, MessageToolCalls } from 'src/shared/types'
import { ApiError, ChatboxAIAPIError } from './errors'
import Base, { onResultChange } from './base'
import * as settingActions from '@/stores/settingActions'
import {
  injectModelSystemPrompt,
  populateOpenAIMessageVision,
  populateOpenAIMessageText,
  OpenAIMessage,
  OpenAIMessageVision,
} from './openai'
import { last, uniq } from 'lodash'
import { fixMessageRoleSequence } from './llm_utils'
import { webSearchTool } from '../web-search'
import { apiRequest } from '@/utils/request'
import { handleSSE } from '@/utils/stream'

export default abstract class StandardOpenAI extends Base {
  public name = 'OpenAI Compatible'

  public secretKey = ''
  public apiHost = ''

  public model = ''
  public temperature?: number
  public topP?: number

  public injectDefaultMetadata = true
  public useProxy = false

  constructor() {
    super()
  }

  protected get webSearchModel() {
    return this.model
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
    const model = this.model
    if (this.injectDefaultMetadata) {
      rawMessages = injectModelSystemPrompt(model, rawMessages)
    }
    let messages = await this.populateMessages(fixMessageRoleSequence(rawMessages), model)
    const requestBody = {
      messages,
      model,
      temperature: this.temperature,
      top_p: this.topP,
      stream: true,
      tools: options?.webBrowsing ? [webSearchTool] : undefined,
    }
    const proceed = () => this.requestChatCompletionsStream(requestBody, signal, onResultChange)

    if (!options?.webBrowsing || this.isSupportToolUse()) {
      return proceed()
    }
    // 正常不应该走到这里，在base里会进入通用搜索
    requestBody.tools = undefined
    return proceed()
  }

  async requestChatCompletionsStream(
    requestBody: Record<string, any>,
    signal?: AbortSignal,
    onResultChange?: onResultChange
  ): Promise<string> {
    const response = await apiRequest.post(`${this.apiHost}/chat/completions`, this.getHeaders(), requestBody, {
      signal,
      useProxy: this.useProxy,
    })
    let result = ''
    let reasoningContent: string | undefined = undefined
    const finalToolCalls: MessageToolCalls = {}
    await handleSSE(response, (message) => {
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
          onResultChange({ content: result, reasoningContent, toolCalls: finalToolCalls })
        }
      }
      // 支持 deepseek r1 的思考链
      const reasoningContentPart = data.choices[0]?.delta?.reasoning_content|| data.choices[0]?.delta?.reasoning
      if (typeof reasoningContentPart === 'string') {
        if (!reasoningContent) {
          reasoningContent = ''
        }
        reasoningContent += reasoningContentPart
        if (onResultChange) {
          onResultChange({ content: result, reasoningContent, toolCalls: finalToolCalls })
        }
      }
      // 处理一些本地部署或三方的 deepseek-r1 返回中的 <think>...</think> 思考链
      if (
        !reasoningContent &&
        this.model.includes('deepseek-r') &&
        result.includes('<think>') &&
        result.includes('</think>')
      ) {
        const index = result.lastIndexOf('</think>')
        reasoningContent = result.slice(0, index + 8)
        result = result.slice(index + 8)
      }
      if (onResultChange) {
        onResultChange({ content: result, reasoningContent, toolCalls: finalToolCalls })
      }
    })
    return result
  }

  async requestChatCompletionsNotStream(
    requestBody: Record<string, any>,
    signal?: AbortSignal,
    onResultChange?: onResultChange
  ): Promise<string> {
    const response = await apiRequest.post(`${this.apiHost}/chat/completions`, this.getHeaders(), requestBody, {
      signal,
      useProxy: this.useProxy,
    })
    const json = await response.json()
    if (json.error) {
      throw new ApiError(`Error from ${this.name}: ${JSON.stringify(json)}`)
    }
    const content: string = json.choices[0].message.content || ''
    if (onResultChange) {
      onResultChange({ content })
    }
    return content
  }

  async callImageGeneration(prompt: string, signal?: AbortSignal): Promise<string> {
    throw new Error('Not implemented')
    // const res = await this.post(
    //     `${this.options.apiHost}/images/generations`,
    //     this.getHeaders(),
    //     {
    //         prompt,
    //         response_format: 'b64_json',
    //         model: 'dall-e-3',
    //         style: this.options.dalleStyle,
    //     },
    //     { signal }
    // )
    // const json = await res.json()
    // return json['data'][0]['b64_json']
  }

  getHeaders() {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    }
    return headers
  }

  async listRemoteModels(): Promise<string[]> {
    const response = await apiRequest.get(`${this.apiHost}/models`, this.getHeaders(), {
      useProxy: this.useProxy,
    })
    const json: ListModelsResponse = await response.json()
    if (!json.data) {
      throw new ApiError(JSON.stringify(json))
    }
    return json.data.map((item) => item.id)
  }

  listLocalModels(): string[] {
    return []
  }

  async listModels(): Promise<string[]> {
    const locals = this.listLocalModels()
    const remotes = await this.listRemoteModels().catch(() => [])
    return uniq([...locals, ...remotes])
  }

  isSupportVision(model: string): boolean {
    return true
  }

  async populateMessages(rawMessages: Message[], model: string): Promise<OpenAIMessage[] | OpenAIMessageVision[]> {
    if (this.isSupportVision(model) && rawMessages.some((m) => m.pictures && m.pictures.length > 0)) {
      return await populateOpenAIMessageVision(rawMessages)
    } else {
      return await populateOpenAIMessageText(rawMessages)
    }
  }
}

export interface ListModelsResponse {
  object: 'list'
  data: {
    id: string
    object: 'model'
    created: number
    owned_by: string
  }[]
}
