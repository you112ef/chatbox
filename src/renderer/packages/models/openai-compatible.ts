import * as settingActions from '@/stores/settingActions'
import { apiRequest } from '@/utils/request'
import { handleSSE } from '@/utils/stream'
import { uniq } from 'lodash'
import { Message, MessageToolCalls } from 'src/shared/types'
import { webSearchTool } from '../web-search'
import { CallChatCompletionOptions, ModelInterface } from './base'
import { AIProviderNoImplementedPaintError, ApiError, ChatboxAIAPIError } from './errors'
import { fixMessageRoleSequence } from './llm_utils'
import {
  injectModelSystemPrompt,
  OpenAIMessage,
  OpenAIMessageVision,
  populateOpenAIMessageText,
  populateOpenAIMessageVision,
} from './openai'

interface OpenAICompatibleSettings {
  apiKey: string
  apiHost: string
  model: string
  temperature?: number
  topP?: number
  useProxy?: boolean
}

export default abstract class OpenAICompatible implements ModelInterface {
  public name = 'OpenAI Compatible'
  public injectDefaultMetadata = true

  constructor(private settings: OpenAICompatibleSettings) {}

  public abstract isSupportToolUse(): boolean

  public async chat(messages: Message[], options: CallChatCompletionOptions): Promise<string> {
    try {
      return await this._callChatCompletion(messages, options)
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

  public async paint(
    prompt: string,
    num: number,
    callback?: (picBase64: string) => any,
    signal?: AbortSignal
  ): Promise<string[]> {
    throw new AIProviderNoImplementedPaintError(this.name)
  }

  private async _callChatCompletion(rawMessages: Message[], options: CallChatCompletionOptions): Promise<string> {
    const { model } = this.settings
    if (this.injectDefaultMetadata) {
      rawMessages = injectModelSystemPrompt(model, rawMessages)
    }
    const messages = await this.populateMessages(fixMessageRoleSequence(rawMessages))
    const requestBody = {
      messages,
      model,
      temperature: this.settings.temperature,
      top_p: this.settings.topP,
      stream: true,
      tools: options?.webBrowsing ? [webSearchTool] : undefined,
    }
    const response = await apiRequest.post(
      `${this.settings.apiHost}/chat/completions`,
      this.getHeaders(),
      requestBody,
      {
        signal: options.signal,
        useProxy: this.settings.useProxy,
      }
    )
    return this.handleResponse(response, options)
  }

  protected async handleResponse(response: Response, options: CallChatCompletionOptions): Promise<string> {
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
        options.onResultChange?.({ content: result, reasoningContent, toolCalls: finalToolCalls })
      }

      const part = data.choices[0]?.delta?.content
      if (typeof part === 'string') {
        result += part
        options.onResultChange?.({ content: result, reasoningContent, toolCalls: finalToolCalls })
      }
      // 支持 deepseek r1 的思考链
      const reasoningContentPart = data.choices[0]?.delta?.reasoning_content || data.choices[0]?.delta?.reasoning
      if (typeof reasoningContentPart === 'string') {
        if (!reasoningContent) {
          reasoningContent = ''
        }
        reasoningContent += reasoningContentPart
        options.onResultChange?.({ content: result, reasoningContent, toolCalls: finalToolCalls })
      }
      // 处理一些本地部署或三方的 deepseek-r1 返回中的 <think>...</think> 思考链
      if (
        !reasoningContent &&
        this.settings.model.includes('deepseek-r') &&
        result.includes('<think>') &&
        result.includes('</think>')
      ) {
        const index = result.lastIndexOf('</think>')
        reasoningContent = result.slice(0, index + 8)
        result = result.slice(index + 8)
      }
      options.onResultChange?.({ content: result, reasoningContent, toolCalls: finalToolCalls })
    })

    return result
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.settings.apiKey}`,
      'Content-Type': 'application/json',
    }
    return headers
  }

  protected async listRemoteModels(): Promise<string[]> {
    const response = await apiRequest.get(`${this.settings.apiHost}/models`, this.getHeaders(), {
      useProxy: this.settings.useProxy,
    })
    const json: ListModelsResponse = await response.json()
    if (!json.data) {
      throw new ApiError(JSON.stringify(json))
    }
    return json.data.map((item) => item.id)
  }

  protected listLocalModels(): string[] {
    return []
  }

  public async listModels(): Promise<string[]> {
    const locals = this.listLocalModels()
    const remotes = await this.listRemoteModels().catch(() => [])
    return uniq([...locals, ...remotes])
  }

  private async populateMessages(rawMessages: Message[]): Promise<OpenAIMessage[] | OpenAIMessageVision[]> {
    if (rawMessages.some((m) => m.pictures && m.pictures.length > 0)) {
      return populateOpenAIMessageVision(rawMessages)
    }
    return populateOpenAIMessageText(rawMessages)
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
