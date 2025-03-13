import * as base64 from '@/packages/base64'
import storage from '@/storage'
import { apiRequest } from '@/utils/request'
import { handleNdjson } from '@/utils/stream'
import { Message } from 'src/shared/types'
import Base, { CallChatCompletionOptions, ModelHelpers } from './base'
import { ApiError } from './errors'

// 也可以考虑官方库
// import ollama from 'ollama/browser'

const helpers: ModelHelpers = {
  isModelSupportVision: (model: string) => {
    return false
  },
  isModelSupportToolUse: (model: string) => {
    return false
  },
}

interface Options {
  ollamaHost: string
  ollamaModel: string
  temperature: number
}

export default class Ollama extends Base {
  public name = 'Ollama'
  public static helpers = helpers

  constructor(public options: Options) {
    super()
  }

  isSupportToolUse(): boolean {
    return helpers.isModelSupportToolUse(this.options.ollamaModel)
  }

  getHost(): string {
    let host = this.options.ollamaHost.trim()
    if (host.endsWith('/')) {
      host = host.slice(0, -1)
    }
    if (!host.startsWith('http')) {
      host = 'http://' + host
    }
    if (host === 'http://localhost:11434') {
      host = 'http://127.0.0.1:11434' // 让其在浏览器中也能访问
    }
    return host
  }

  async callChatCompletion(rawMessages: Message[], options: CallChatCompletionOptions): Promise<string> {
    // https://github.com/ollama/ollama/blob/main/docs/api.md#chat-request-with-images
    const messages = await Promise.all(
      rawMessages.map(async (m) => {
        const ret = {
          role: m.role,
          content: m.content,
          images: undefined as string[] | undefined,
        }
        if (m.pictures) {
          ret.images = []
          for (const pic of m.pictures) {
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
            ret.images.push(picData.data)
          }
        }
        return ret
      })
    )
    const res = await apiRequest.post(
      `${this.getHost()}/api/chat`,
      { 'Content-Type': 'application/json' },
      {
        model: this.options.ollamaModel,
        messages,
        stream: true,
        options: {
          temperature: this.options.temperature,
        },
      },
      { signal: options.signal }
    )
    let content = ''
    let reasoningContent: string | undefined
    await handleNdjson(res, (message) => {
      const data = JSON.parse(message)
      if (data['done']) {
        return
      }
      const contentPart: string | undefined = data['message']?.['content']
      if (!contentPart) {
        throw new ApiError(JSON.stringify(data))
      }
      content += contentPart
      // 处理 deepseek-r 的 <think>...</think> 标签
      if (this.options.ollamaModel.includes('deepseek-r')) {
        if (content.includes('</think>')) {
          const index = content.lastIndexOf('</think>')
          reasoningContent = content.slice(0, index + 8)
          content = content.slice(index + 8)
        }
      }
      options.onResultChange?.({ content, reasoningContent })
    })
    return content
  }

  async listModels(): Promise<string[]> {
    const res = await apiRequest.get(`${this.getHost()}/api/tags`, {})
    const json = await res.json()
    if (!json['models']) {
      throw new ApiError(JSON.stringify(json))
    }
    return json['models'].map((m: any) => m['name'])
  }
}
