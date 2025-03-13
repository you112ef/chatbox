import { sequenceMessages } from '@/utils/message'
import { PROMPT_ANSWER_WITH_SEARCH_RESULTS, PROMPT_CONSTRUCT_SEARCH_ACTION } from '@/utils/prompts'
import { isEmpty, last } from 'lodash'
import { Message, MessageToolCalls, MessageWebBrowsing, ModelMeta } from 'src/shared/types'
import { webSearchExecutor } from '../web-search'
import { AIProviderNoImplementedChatError, AIProviderNoImplementedPaintError } from './errors'
import * as settingActions from '@/stores/settingActions'

export interface ModelHelpers {
  isModelSupportVision(model: string): boolean
  isModelSupportToolUse(model: string): boolean
}

export default abstract class Base {
  public name = 'Unknown'
  public modelMeta: ModelMeta = {}
  public static helpers: ModelHelpers

  protected abstract isSupportToolUse(): boolean

  protected async callChatCompletion(
    messages: Message[],
    signal?: AbortSignal,
    onResultChange?: onResultChange,
    options?: {
      webBrowsing?: boolean
    }
  ): Promise<string> {
    throw new AIProviderNoImplementedChatError(this.name)
  }

  protected async callImageGeneration(prompt: string, signal?: AbortSignal): Promise<string> {
    throw new AIProviderNoImplementedPaintError(this.name)
  }

  private async callTool(
    name: string,
    args: any,
    { abortSignal }: { abortSignal: AbortSignal },
    onResultChange?: onResultChange
  ) {
    if (name === 'web_search') {
      const result = await webSearchExecutor(args, { abortSignal })
      onResultChange?.({
        webBrowsing: {
          query: args.query.split(' '),
          links: result.searchResults.map((it) => {
            return {
              title: it.title,
              url: it.link,
            }
          }),
        },
      })
      return result
    }
  }

  private async _chat(
    messages: Message[],
    onResultChangeWithCancel?: onResultChangeWithCancel,
    options?: {
      webBrowsing?: boolean
    }
  ): Promise<string> {
    // 初始化 fetch 的取消机制
    let canceled = false
    const controller = new AbortController()
    const cancel = () => {
      canceled = true
      controller.abort()
    }
    let result = ''
    let toolCalls: MessageToolCalls | undefined
    try {
      // 支持 onResultUpdated 回调
      let onResultChange: onResultChange | undefined = undefined
      if (onResultChangeWithCancel) {
        onResultChangeWithCancel({ content: result, cancel }) // 这里先传递 cancel 方法
        onResultChange = (data) => {
          result = data.content ?? result
          toolCalls = data.toolCalls
          onResultChangeWithCancel({ ...data, cancel })
        }
      }

      const proceed = async (messages: Message[]) =>
        await this.callChatCompletion(messages, controller.signal, onResultChange, options)

      if (options?.webBrowsing && !this.isSupportToolUse()) {
        // model do not support tool use, construct query then provide results to model
        const { query, searchResults } = (await this.doSearch(messages, controller.signal)) ?? {}
        if (!searchResults) {
          return proceed(messages)
        }
        onResultChange?.({
          webBrowsing: {
            query: query!.split(' '),
            links: searchResults.map((it) => {
              return {
                title: it.title,
                url: it.link,
              }
            }),
          },
        })
        return proceed(constructMessagesWithSearchResults(messages, searchResults))
      }

      // 调用各个模型提供商的底层接口方法
      result = await proceed(messages)

      if (!isEmpty(toolCalls)) {
        messages.push({
          id: '',
          role: 'assistant',
          content: result,
          toolCalls,
        })
        for (const toolCall of Object.values(toolCalls)) {
          const name = toolCall.function.name
          try {
            const args = JSON.parse(toolCall.function.arguments)
            const result = await this.callTool(name, args, { abortSignal: controller.signal }, onResultChange)
            messages.push({
              id: toolCall.id, // store tool_call_id in id field
              role: 'tool',
              content: result ? JSON.stringify(result) : '',
            })
          } catch (e) {
            if (e instanceof SyntaxError) {
              continue
            }
            throw e
          }
        }
        // call llm with tool result
        result = await this.callChatCompletion(messages, controller.signal, onResultChange, options)
      }
    } catch (error) {
      /// 处理 fetch 被取消的情况
      // if a cancellation is performed
      // do not throw an exception
      // otherwise the content will be overwritten.
      if (canceled) {
        return result
      }
      // 如果不是取消，那么正常抛出错误
      throw error
    }
    return result
  }

  public async chat(
    messages: Message[],
    onResultChangeWithCancel?: onResultChangeWithCancel,
    options?: {
      webBrowsing?: boolean
    }
  ): Promise<string> {
    return await this._chat(messages, onResultChangeWithCancel, options)
  }

  public async paint(
    prompt: string,
    num: number,
    callback?: (picBase64: string) => any,
    signal?: AbortSignal
  ): Promise<string[]> {
    const concurrence: Promise<string>[] = []
    for (let i = 0; i < num; i++) {
      concurrence.push(
        this.callImageGeneration(prompt, signal).then((picBase64) => {
          if (callback) {
            callback(picBase64)
          }
          return picBase64
        })
      )
    }
    return await Promise.all(concurrence)
  }

  private async doSearch(messages: Message[], signal?: AbortSignal) {
    const language = settingActions.getLanguage()
    // prettier-ignore
    const systemPrompt = PROMPT_CONSTRUCT_SEARCH_ACTION.replace('{{current_date}}', new Date().toLocaleDateString()).replace('{{language}}', language)
    const queryResponse = await this.callChatCompletion(
      sequenceMessages([
        {
          id: '',
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ]),
      signal
    )
    // extract json from response
    const regex = /{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*}/
    const match = queryResponse.match(regex)
    if (match) {
      const jsonString = match[0]
      const jsonObject = JSON.parse(jsonString) as {
        action: 'search' | 'proceed'
        query: string
      }
      if (jsonObject.action === 'search') {
        const { searchResults } = await webSearchExecutor({ query: jsonObject.query }, { abortSignal: signal })
        return { query: jsonObject.query?.toString(), searchResults }
      } else {
        return null
      }
    }

    return null
  }
}

export interface ResultChange {
  content?: string
  webBrowsing?: MessageWebBrowsing
  reasoningContent?: string
  toolCalls?: MessageToolCalls
}

export type onResultChangeWithCancel = (data: ResultChange & { cancel?: () => void }) => void
export type onResultChange = (data: ResultChange) => void

function constructMessagesWithSearchResults(
  messages: Message[],
  searchResults: { title: string; snippet: string; link: string }[]
) {
  const systemPrompt = PROMPT_ANSWER_WITH_SEARCH_RESULTS.replace('{{current_date}}', new Date().toLocaleDateString())
  const formattedSearchResults = searchResults
    .map((it, i) => {
      return `[webpage ${i + 1} begin]
Title: ${it.title}
URL: ${it.link}
Content: ${it.snippet}
[webpage ${i + 1} end]`
    })
    .join('\n')

  return sequenceMessages([
    {
      id: '',
      role: 'system' as const,
      content: systemPrompt,
    },
    ...messages.slice(0, -1), // 最新一条用户消息和搜索结果放在一起了
    {
      id: '',
      role: 'user' as const,
      content: `${formattedSearchResults}\nUser Message:\n${last(messages)!.content}`,
    },
  ])
}
