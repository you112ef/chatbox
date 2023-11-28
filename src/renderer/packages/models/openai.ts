import { OpenAIMessage } from 'src/shared/types'
import Base from './base'
import { ApiError } from './errors'
import { onResultChange } from './interfaces'

interface Options {
    openaiKey: string
    apiHost: string
    model: Model | 'custom-model'
    dalleStyle: 'vivid' | 'natural'
    openaiCustomModel?: string // OpenAI 自定义模型的 ID
    openaiMaxTokens: number
    temperature: number
    topP: number
}

export default class OpenAI extends Base {
    public name = 'OpenAI'

    public options: Options
    constructor(options: Options) {
        super()
        this.options = options
        if (this.options.apiHost && this.options.apiHost.trim().length === 0) {
            this.options.apiHost = 'https://api.openai.com'
        }
    }

    async callChatCompletion(messages: OpenAIMessage[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        const response = await this.post(
            `${this.options.apiHost}/v1/chat/completions`,
            this.getHeaders(),
            {
                messages,
                model: this.options.model === 'custom-model'
                    ? this.options.openaiCustomModel || ''
                    : this.options.model,
                max_tokens: this.options.openaiMaxTokens === 0 ? undefined : this.options.openaiMaxTokens,
                temperature: this.options.temperature,
                top_p: this.options.topP,
                stream: true,
            },
            signal
        )
        let result = ''
        await this.handleSSE(response, (message) => {
                if (message === '[DONE]') {
                    return
                }
                const data = JSON.parse(message)
                if (data.error) {
                    throw new ApiError(`Error from OpenAI: ${JSON.stringify(data)}`)
                }
                const text = data.choices[0]?.delta?.content
                if (text !== undefined) {
                    result += text
                    if (onResultChange) {
                        onResultChange(result)
                    }
                }
            }
        )
        return result
    }

    async callImageGeneration(prompt: string, signal?: AbortSignal): Promise<string> {
        if (this.options.apiHost.endsWith('/')) {
            this.options.apiHost = this.options.apiHost.slice(0, -1)
        }
        const res = await this.post(
            `${this.options.apiHost}/v1/images/generations`,
            this.getHeaders(),
            {
                prompt,
                response_format: 'b64_json',
                model: 'dall-e-3',
                style: this.options.dalleStyle,
            },
            signal
        )
        const json = await res.json()
        return json['data'][0]['b64_json']
    }

    getHeaders() {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.options.openaiKey}`,
            'Content-Type': 'application/json',
        }
        if (this.options.apiHost.includes('openrouter.ai')) {
            headers['HTTP-Referer'] = 'https://localhost:3000/' // 支持 OpenRouter，需要设置这个表头才能正常工作
        }
        return headers
    }
}

// Ref: https://platform.openai.com/docs/models/gpt-4
export const modelConfigs = {
    'gpt-3.5-turbo': {
        maxTokens: 4096, // 模型支持最大的token数
    },
    'gpt-3.5-turbo-0613': {
        maxTokens: 4096,
    },
    'gpt-3.5-turbo-16k': {
        maxTokens: 16384,
    },
    'gpt-3.5-turbo-16k-0613': {
        maxTokens: 16384,
    },
    'gpt-3.5-turbo-1106': {
        maxTokens: 16384,
    },

    'gpt-4': {
        maxTokens: 8192,
    },
    'gpt-4-0613': {
        maxTokens: 8192,
    },
    'gpt-4-32k': {
        maxTokens: 32768,
    },
    'gpt-4-32k-0613': {
        maxTokens: 32768,
    },
    'gpt-4-1106-preview': {
        maxTokens: 128000,
    },
    // 'gpt-4-vision-preview': {
    //     maxTokens: 128000,
    // },

    // 以下模型延长到了 2024 年 6 月
    // https://platform.openai.com/docs/models/continuous-model-upgrades
    'gpt-3.5-turbo-0301': {
        maxTokens: 4096,
    },
    'gpt-4-0314': {
        maxTokens: 8192,
    },
    'gpt-4-32k-0314': {
        maxTokens: 32768,
    },
}
export type Model = keyof typeof modelConfigs
export const models = Array.from(Object.keys(modelConfigs)).sort() as Model[]
