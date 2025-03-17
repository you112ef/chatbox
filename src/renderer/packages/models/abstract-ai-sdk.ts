import * as settingActions from '@/stores/settingActions'
import { CoreMessage, jsonSchema, LanguageModelV1, streamText, tool } from 'ai'
import { Message, MessageToolCalls } from 'src/shared/types'
import { webSearchTool as rawWebSearchTool } from '../web-search'
import { CallChatCompletionOptions, ModelInterface } from './base'
import { ApiError, ChatboxAIAPIError } from './errors'
import { fixMessageRoleSequence } from './llm_utils'
import { injectModelSystemPrompt } from './openai'

const webSearchTool = tool({
  description: rawWebSearchTool.function.description,
  parameters: jsonSchema(rawWebSearchTool.function.parameters as any),
})

// ai sdk CallSettings类型的子集
export interface CallSettings {
  temperature?: number
  topP?: number
}

export default abstract class AbstractAISDKModel implements ModelInterface {
  public name = 'AI SDK Model'
  public injectDefaultMetadata = true

  protected abstract getChatModel(): LanguageModelV1
  public abstract isSupportToolUse(): boolean

  protected getCallSettings(): CallSettings {
    return {}
  }

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
    throw new Error('Not implemented')
  }

  private async _callChatCompletion(rawMessages: Message[], options: CallChatCompletionOptions): Promise<string> {
    const model = this.getChatModel()

    if (this.injectDefaultMetadata) {
      rawMessages = injectModelSystemPrompt(model.modelId, rawMessages)
    }
    const messages = fixMessageRoleSequence(rawMessages)

    const result = streamText({
      model,
      maxSteps: 1,
      messages: transformMessages(messages),
      tools: options?.webBrowsing ? { web_search: webSearchTool } : undefined,
      abortSignal: options.signal,
      ...this.getCallSettings(),
    })

    let textContent = ''
    let reasoningContent = ''
    const toolCalls: MessageToolCalls = {}

    for await (const chunk of result.fullStream) {
      console.debug('stream chunk', chunk)
      if (chunk.type === 'text-delta') {
        textContent += chunk.textDelta
      } else if (chunk.type === 'reasoning') {
        reasoningContent += chunk.textDelta
      } else if (chunk.type === 'tool-call') {
        toolCalls[chunk.toolCallId] = {
          id: chunk.toolCallId,
          function: {
            name: chunk.toolName,
            arguments: JSON.stringify(chunk.args),
          },
        }
      } else if (chunk.type === 'error') {
        throw new ApiError(`Error from ${this.name}: ${chunk.error}`)
      } else {
        continue
      }
      options.onResultChange?.({ content: textContent, reasoningContent, toolCalls })
    }

    const sources = await result.sources // 已知perplexity会返回，以后可能还会有别的
    if (sources) {
      options.onResultChange?.({
        content: textContent,
        reasoningContent,
        toolCalls,
        webBrowsing: {
          query: [],
          links: sources.map((source) => ({
            title: source.title || source.url,
            url: source.url,
          })),
        },
      })
    }

    return textContent
  }
}

function transformMessages(messages: Message[]): CoreMessage[] {
  return messages.map((m) => {
    switch (m.role) {
      case 'system':
        return { role: 'system', content: m.content }
      case 'user':
        const pictures = (m.pictures || []).filter((p) => p.url)
        return {
          role: 'user',
          content:
            pictures && pictures.length > 0
              ? [{ type: 'text', text: m.content }, ...pictures.map((p) => ({ type: 'image' as const, image: p.url! }))]
              : m.content,
        }
      case 'assistant':
        return { role: 'assistant', content: m.content }
      case 'tool':
        return {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: m.id,
              toolName: m.name!,
              result: m.content,
            },
          ],
        }
      default:
        const _exhaustiveCheck: never = m.role
        throw new Error(`Unkown role: ${_exhaustiveCheck}`)
    }
  })
}
