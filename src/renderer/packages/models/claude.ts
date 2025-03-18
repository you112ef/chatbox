import * as base64 from '@/packages/base64'
import storage from '@/storage'
import { sequenceMessages } from '@/utils/message'
import { apiRequest } from '@/utils/request'
import { handleSSE } from '@/utils/stream'
import { get } from 'lodash'
import { Message, ModelMeta } from 'src/shared/types'
import Base, { CallChatCompletionOptions, ModelHelpers } from './base'
import { ApiError } from './errors'

// 官方 SDK 明确声明用于 Node.js，在浏览器中会导致页面白屏。
// import Anthropic from '@anthropic-ai/sdk'
// import { MessageParam } from '@anthropic-ai/sdk/resources'

// https://docs.anthropic.com/claude/docs/models-overview
const modelConfig: ModelMeta = {
  'claude-3-5-sonnet-latest': {
    contextWindow: 200_000,
    maxOutput: 8192,
    vision: true,
  },
  'claude-3-5-sonnet-20241022': {
    contextWindow: 200_000,
    maxOutput: 8192,
    vision: true,
  },
  'claude-3-5-sonnet-20240620': {
    contextWindow: 200_000,
    maxOutput: 4096,
    vision: true,
  },

  'claude-3-5-haiku-20241022': {
    contextWindow: 200_000,
    maxOutput: 4096,
    vision: true,
  },

  'claude-3-opus-20240229': {
    contextWindow: 200_000,
    maxOutput: 4096,
    vision: true,
  },
  'claude-3-sonnet-20240229': {
    contextWindow: 200_000,
    maxOutput: 4096,
    vision: true,
  },
  'claude-3-haiku-20240307': {
    contextWindow: 200_000,
    maxOutput: 4096,
    vision: true,
  },
  'claude-2.1': {
    contextWindow: 200_000,
    maxOutput: 4096,
    vision: false,
  },
  'claude-2.0': {
    contextWindow: 100_000,
    maxOutput: 4096,
    vision: false,
  },
  'claude-instant-1.2': {
    contextWindow: 100_000,
    maxOutput: 4096,
    vision: false,
  },
}

export const claudeModels = Object.keys(modelConfig)

const helpers: ModelHelpers = {
  isModelSupportVision: (model: string) => {
    return model.startsWith('claude-3')
  },
  isModelSupportToolUse: (model: string) => {
    return true
  },
}

interface Options {
  claudeApiKey: string
  claudeApiHost: string
  claudeModel: string
}

export default class Claude extends Base {
  public name = 'Claude'
  public static helpers = helpers

  constructor(public options: Options) {
    super()
  }

  isSupportToolUse() {
    return helpers.isModelSupportToolUse(this.options.claudeModel)
  }

  async callChatCompletion(rawMessages: Message[], options: CallChatCompletionOptions): Promise<string> {
    // 经过测试，Bedrock Claude 3 的消息必须以 user 角色开始，并且 user 和 assistant 角色必须交替出现，否则都会出现回答异常
    rawMessages = sequenceMessages(rawMessages)

    let prompt = ''
    const messages: ClaudeMessage[] = []
    for (const msg of rawMessages) {
      if (msg.role === 'system') {
        // 系统消息追加到 prompt 中
        prompt += msg.content + '\n'
      } else {
        // 用户消息追加到 messages 中
        const newMessage: ClaudeMessage = { role: msg.role === 'tool' ? 'user' : msg.role, content: [] }
        // 构造图片
        for (const [i, pic] of Object.entries(msg.pictures || [])) {
          if (!pic.storageKey) {
            continue
          }
          const picBase64 = await storage.getBlob(pic.storageKey)
          if (!picBase64) {
            continue
          }
          const picData = base64.parseImage(picBase64)
          if (!picData.type || !picData.data) {
            continue
          }
          // 先图片后文字可提高 claude 的识别效果；使用 Image-No. 的 prompt 技巧区分图片
          // https://docs.anthropic.com/claude/docs/vision#image-best-practices
          // https://docs.anthropic.com/claude/docs/vision#3-example-multiple-images-with-a-system-prompt
          newMessage.content.push({
            type: 'text',
            text: `Image ${parseInt(i) + 1}:`,
          })
          newMessage.content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: picData.type,
              data: picData.data,
            },
          })
        }
        // 构造文本
        if (msg.content) {
          newMessage.content.push({ type: 'text', text: msg.content })
        }
        messages.push(newMessage)
      }
    }

    let url = `${this.options.claudeApiHost}/v1/messages`

    const response = await apiRequest.post(
      url,
      this.getHeaders(),
      {
        model: this.options.claudeModel,
        max_tokens: modelConfig[this.options.claudeModel] // 兼容旧版本的问题（不一定存在）
          ? modelConfig[this.options.claudeModel].maxOutput
          : 4096,
        system: prompt,
        messages: messages,
        stream: true,
      },
      {
        signal: options.signal,
      }
    )
    let result = ''
    await handleSSE(response, (message) => {
      const data = JSON.parse(message)
      if (data.error) {
        throw new ApiError(`Error from Claude: ${JSON.stringify(data)}`)
      }
      const word: string = get(data, 'delta.text', '')
      if (word) {
        result += word
        options.onResultChange?.({ content: result })
      }
    })
    return result
  }

  getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': this.options.claudeApiKey,
      'anthropic-dangerous-direct-browser-access': 'true',
    }
    return headers
  }

  // https://docs.anthropic.com/en/docs/api/models
  async listModels(): Promise<string[]> {
    type Response = {
      data: {
        id: string
        type: string
      }[]
    }
    const url = `${this.options.claudeApiHost}/v1/models?limit=990`
    const res = await apiRequest.get(url, this.getHeaders())
    const json: Response = await res.json()
    // {
    //   "data": [
    //     {
    //       "type": "model",
    //       "id": "claude-3-5-sonnet-20241022",
    //       "display_name": "Claude 3.5 Sonnet (New)",
    //       "created_at": "2024-10-22T00:00:00Z"
    //     }
    //   ],
    //   "has_more": true,
    //   "first_id": "<string>",
    //   "last_id": "<string>"
    // }
    if (!json['data']) {
      throw new ApiError(JSON.stringify(json))
    }
    return json['data'].filter((item) => item.type === 'model').map((item) => item.id)
  }
}

export interface ClaudeMessage {
  role: 'assistant' | 'user'
  content: (
    | {
        text: string
        type: 'text'
      }
    | {
        type: 'image'
        source: {
          type: 'base64'
          media_type: string
          data: string
        }
      }
  )[]
}
