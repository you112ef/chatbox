import { apiRequest } from '@/utils/request'
import { handleSSE } from '@/utils/stream'
import { ModelHelpers, onResultChange } from './base'
import { ApiError } from './errors'
import OpenAICompatible from './openai-compatible'

const helpers: ModelHelpers = {
  isModelSupportVision: (model: string) => {
    return false
  },
  isModelSupportToolUse: (model: string) => {
    return false
  },
}

interface Options {
  perplexityApiKey: string
  perplexityModel: string
  temperature?: number
  topP?: number
}

export default class Perplexity extends OpenAICompatible {
  public name = 'Perplexity API'
  public static helpers = helpers

  constructor(public options: Options) {
    super()
    this.secretKey = options.perplexityApiKey
    this.apiHost = 'https://api.perplexity.ai'
    this.model = options.perplexityModel
    this.temperature = options.temperature
    this.topP = options.topP
  }

  isSupportToolUse() {
    return helpers.isModelSupportToolUse(this.options.perplexityModel)
  }

  listLocalModels(): string[] {
    return [
      'sonar-reasoning-pro',
      'sonar-reasoning',
      'sonar-pro',
      'sonar',
      // 'llama-3.1-sonar-small-128k-online',
      // 'llama-3.1-sonar-large-128k-online',
      // 'llama-3.1-sonar-huge-128k-online'
    ]
  }

  async listRemoteModels(): Promise<string[]> {
    // perplexity api 不提供模型列表接口
    // https://docs.perplexity.ai/api-reference/chat-completions
    return []
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
    let content = ''
    let reasoningContent: string | undefined
    await handleSSE(response, (message) => {
      if (message === '[DONE]') {
        return
      }
      const data = JSON.parse(message)
      if (data.error) {
        throw new ApiError(`Error from ${this.name}: ${JSON.stringify(data)}`)
      }
      const citations: string[] | undefined = data.citations
      const text = data.choices[0]?.delta?.content
      if (typeof text === 'string') {
        content += text
      }
      // 处理返回中的 <think>...</think> 思考链
      if (
        !reasoningContent &&
        this.model.includes('reasoning') &&
        content.includes('<think>') &&
        content.includes('</think>')
      ) {
        const index = content.lastIndexOf('</think>')
        reasoningContent = content.slice(0, index + 8)
        content = content.slice(index + 8)
      }
      if (onResultChange) {
        onResultChange({
          content: content,
          reasoningContent,
          webBrowsing: citations
            ? {
                query: [],
                links: citations.map((url) => ({ title: url, url })),
              }
            : undefined,
        })
      }
    })
    return content
  }
}

// {
//   "id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
//   "model": "llama-3.1-sonar-small-128k-online",
//   "object": "chat.completion",
//   "created": 1724369245,
//   "citations": [
//     "https://www.astronomy.com/science/astro-for-kids-how-many-stars-are-there-in-space/",
//     "https://www.esa.int/Science_Exploration/Space_Science/Herschel/How_many_stars_are_there_in_the_Universe",
//     "https://www.space.com/25959-how-many-stars-are-in-the-milky-way.html",
//     "https://www.space.com/26078-how-many-stars-are-there.html",
//     "https://en.wikipedia.org/wiki/Milky_Way",
//     "https://www.littlepassports.com/blog/space/how-many-stars-are-in-the-universe/?srsltid=AfmBOoqWVymRloolU4KZBI9-LotDIoTnzhKYKCw7vVkaIifhjrEU66_5"
//   ],
//   "choices": [
//     {
//       "index": 0,
//       "finish_reason": "stop",
//       "message": {
//         "role": "assistant",
//         "content": "The number of stars in the Milky Way galaxy is estimated to be between 100 billion and 400 billion stars. The most recent estimates from the Gaia mission suggest that there are approximately 100 to 400 billion stars in the Milky Way, with significant uncertainties remaining due to the difficulty in detecting faint red dwarfs and brown dwarfs."
//       },
//       "delta": {
//         "role": "assistant",
//         "content": ""
//       }
//     }
//   ],
//   "usage": {
//     "prompt_tokens": 14,
//     "completion_tokens": 70,
//     "total_tokens": 84
//   }
// }
