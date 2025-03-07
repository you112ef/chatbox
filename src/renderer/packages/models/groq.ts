import { Message } from 'src/shared/types'
import Base, { onResultChange } from './base'
import { ApiError } from './errors'
import { populateOpenAIMessageText } from './openai'

// https://console.groq.com/docs/models
export const modelConfig = {
  'llama-3.2-1b-preview': {
    vision: false,
  },
  'llama-3.2-3b-preview': {
    vision: false,
  },
  'llama-3.2-11b-text-preview': {
    vision: false,
  },
  'llama-3.2-90b-text-preview': {
    vision: false,
  },

  'llama-3.1-70b-versatile': {
    vision: false,
  },
  'llama-3.1-8b-instant': {
    vision: false,
  },
  'llama3-groq-70b-8192-tool-use-preview': {
    vision: false,
  },
  'llama3-groq-8b-8192-tool-use-preview': {
    vision: false,
  },
  'llama-guard-3-8b': {
    vision: false,
  },

  'llama3-8b-8192': {
    vision: false,
  },
  'llama3-70b-8192': {
    vision: false,
  },
  'llama2-70b-4096': {
    vision: false,
  },
  'mixtral-8x7b-32768': {
    vision: false,
  },
}

export type GroqModel = keyof typeof modelConfig

export const groqModels: GroqModel[] = Object.keys(modelConfig) as GroqModel[]

interface Options {
  groqAPIKey: string
  groqModel: GroqModel
  temperature: number
}

export default class Groq extends Base {
  public name = 'Groq'

  public options: Options
  constructor(options: Options) {
    super()
    this.options = options
  }

  isSupportToolUse(): boolean {
    return false
  }

  async callChatCompletion(
    rawMessages: Message[],
    signal?: AbortSignal,
    onResultChange?: onResultChange
  ): Promise<string> {
    const messages = await populateOpenAIMessageText(rawMessages)
    const temperature =
      this.options.temperature === 0
        ? 0.1 // Groq 不支持 temperature 为 0, https://console.groq.com/docs/openai
        : this.options.temperature
    const response = await this.post(
      `https://api.groq.com/openai/v1/chat/completions`,
      this.getHeaders(),
      {
        messages,
        model: this.options.groqModel,
        temperature,
        stream: true,
      },
      { signal }
    )
    let result = ''
    await this.handleSSE(response, (message) => {
      if (message === '[DONE]') {
        return
      }
      const data = JSON.parse(message)
      if (data.error) {
        throw new ApiError(`Error from ${this.name}: ${JSON.stringify(data)}`)
      }
      const text = data.choices[0]?.delta?.content
      if (text !== undefined) {
        result += text
        if (onResultChange) {
          onResultChange({ content: result })
        }
      }
    })
    return result
  }

  getHeaders() {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.options.groqAPIKey}`,
      'Content-Type': 'application/json',
    }
    return headers
  }

  async listModels(): Promise<string[]> {
    // https://console.groq.com/docs/api-reference#models-list
    type Response = {
      data: {
        id: string
        object: string
        created: number
        owned_by: string
        active: boolean
        context_window: number
      }[]
    }
    const res = await this.get(`https://api.groq.com/openai/v1/models`, this.getHeaders())
    const json: Response = await res.json()
    if (!json['data']) {
      throw new ApiError(JSON.stringify(json))
    }
    return json['data']
      .filter((item: any) => item['active'] && item['context_window'] && item['object'] === 'model')
      .map((m: any) => m['id'])
      .filter((id: string) => !id.includes('whisper'))
      .sort()
  }
}
