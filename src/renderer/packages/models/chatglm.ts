import { apiRequest } from '@/utils/request'
import { Message, StreamTextResult } from 'src/shared/types'
import Base, { CallChatCompletionOptions, ModelHelpers } from './base'
import { ApiError } from './errors'
import { getMessageText } from '@/utils/message'

const helpers: ModelHelpers = {
  isModelSupportVision: (model: string) => {
    return false
  },
  isModelSupportToolUse: (model: string) => {
    return false
  },
}

interface Options {
  chatglm6bUrl: string
}

export default class ChatGLM extends Base {
  public name = 'ChatGLM'
  public static helpers = helpers

  constructor(public options: Options) {
    super()
  }

  isSupportToolUse() {
    return false
  }

  protected async callChatCompletion(
    messages: Message[],
    options: CallChatCompletionOptions
  ): Promise<StreamTextResult> {
    let prompt = ''
    const history: [string, string][] = []
    let userTmp = ''
    let assistantTmp = ''
    for (const msg of messages) {
      switch (msg.role) {
        case 'system':
          history.push([getMessageText(msg), '好的，我照做，一切都听你的'])
          prompt = getMessageText(msg)
          break
        case 'user':
          if (assistantTmp) {
            history.push([userTmp, assistantTmp])
            userTmp = ''
            assistantTmp = ''
          }
          if (userTmp) {
            userTmp += '\n' + getMessageText(msg)
          } else {
            userTmp = getMessageText(msg)
          }
          prompt = getMessageText(msg)
          break
        case 'assistant':
          if (assistantTmp) {
            assistantTmp += '\n' + getMessageText(msg)
          } else {
            assistantTmp = getMessageText(msg)
          }
          break
      }
    }
    if (assistantTmp) {
      history.push([userTmp, assistantTmp])
    }
    const res = await apiRequest.post(
      this.options.chatglm6bUrl,
      {
        'Content-Type': 'application/json',
      },
      {
        prompt,
        history,
        // temperature,
      },
      { signal: options.signal }
    )
    const json = await res.json()
    if (json.status !== 200) {
      throw new ApiError(JSON.stringify(json))
    }
    const str: string = typeof json.response === 'string' ? json.response : JSON.stringify(json.response)
    options.onResultChange?.({ contentParts: [{ type: 'text', text: str }] })
    return {
      contentParts: [{ type: 'text', text: str }],
    }
  }
}
