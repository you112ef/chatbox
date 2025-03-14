import * as promptFormat from '@/packages/prompts'
import * as settingActions from '@/stores/settingActions'
import { sequenceMessages } from '@/utils/message'
import { last } from 'lodash'
import { Message } from '../../../shared/types'
import { ModelInterface } from '../models/base'
import { webSearchExecutor } from '../web-search'

export async function callTool(name: string, args: any, { signal }: { signal?: AbortSignal }) {
  if (name === 'web_search') {
    return webSearchExecutor(args, { abortSignal: signal })
  }
}

export async function searchByPromptEngineering(model: ModelInterface, messages: Message[], signal?: AbortSignal) {
  const language = settingActions.getLanguage()
  const systemPrompt = promptFormat.contructSearchAction(language)
  const queryResponse = await model.chat(
    sequenceMessages([
      {
        id: '',
        role: 'system',
        content: systemPrompt,
      },
      ...messages,
    ]),
    { signal }
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
      return callTool('web_search', { query: jsonObject.query }, { signal })
    }
  }
}

export function constructMessagesWithSearchResults(
  messages: Message[],
  searchResults: { title: string; snippet: string; link: string }[]
) {
  const systemPrompt = promptFormat.answerWithSearchResults()
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
