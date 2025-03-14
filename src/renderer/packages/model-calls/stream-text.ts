import { isEmpty } from 'lodash'
import { Message, MessageToolCalls } from '../../../shared/types'
import { ModelInterface, OnResultChange, onResultChangeWithCancel } from '../models/base'
import { callTool, constructMessagesWithSearchResults, searchByPromptEngineering } from './tools'

async function handleToolCalls(
  messages: Message[],
  toolCalls: MessageToolCalls,
  { onResultChange, signal }: { onResultChange: OnResultChange; signal: AbortSignal }
) {
  for (const toolCall of Object.values(toolCalls)) {
    const name = toolCall.function.name
    let args: any
    try {
      args = JSON.parse(toolCall.function.arguments)
    } catch (err) {
      if (err instanceof SyntaxError) {
        continue
      }
      throw err
    }
    const toolResult = await callTool(name, args, { signal })
    if (name === 'web_search' && toolResult) {
      onResultChange({
        webBrowsing: {
          query: args.query.split(' '),
          links: toolResult.searchResults.map((it) => {
            return { title: it.title, url: it.link }
          }),
        },
      })
    }
    messages.push({
      id: toolCall.id, // store tool_call_id in id field
      role: 'tool',
      content: toolResult ? JSON.stringify(toolResult) : '',
    })
  }
  return messages
}

export async function streamText(
  model: ModelInterface,
  params: {
    messages: Message[]
    onResultChangeWithCancel: onResultChangeWithCancel
    webBrowsing?: boolean
  }
) {
  const controller = new AbortController()
  const cancel = () => controller.abort()

  let result = ''
  let toolCalls: MessageToolCalls | undefined

  try {
    params.onResultChangeWithCancel({ content: result, cancel }) // 这里先传递 cancel 方法
    const onResultChange: OnResultChange = (data) => {
      result = data.content ?? result
      toolCalls = data.toolCalls
      params.onResultChangeWithCancel({ ...data, cancel })
    }

    if (params.webBrowsing && !model.isSupportToolUse()) {
      // 不支持工具调用的模型，则使用prompt engineering的方式进行联网搜索
      const result = await searchByPromptEngineering(model, params.messages, controller.signal)
      if (result) {
        onResultChange({
          webBrowsing: {
            query: result.query.split(' '),
            links: result.searchResults.map((it) => {
              return { title: it.title, url: it.link }
            }),
          },
        })
        return model.chat(constructMessagesWithSearchResults(params.messages, result.searchResults), {
          signal: controller.signal,
          onResultChange,
        })
      }
    }

    result = await model.chat(params.messages, {
      signal: controller.signal,
      onResultChange,
      webBrowsing: params.webBrowsing,
    })

    if (!isEmpty(toolCalls)) {
      params.messages.push({
        id: '',
        role: 'assistant',
        content: result,
        toolCalls,
      })
      const messages = await handleToolCalls(params.messages, toolCalls, { onResultChange, signal: controller.signal })
      result = await model.chat(messages, { onResultChange, signal: controller.signal })
    }
  } catch (err) {
    console.error(err)
    // if a cancellation is performed, do not throw an exception, otherwise the content will be overwritten.
    if (controller.signal.aborted) {
      return result
    }
    throw err
  }

  return result
}
