import { Message } from 'src/shared/types'
import Base, { onResultChange } from './base'
import { ApiError } from './errors'
import { populateOpenAIMessageText } from './openai'
import platform from '@/platform'

// https://api-docs.deepseek.com/zh-cn/quick_start/pricing
export const modelConfig = {
    'deepseek-chat': {
        contextWindow: 64_000,
        maxTokens: 8_000,
        vision: false,
    },
    'deepseek-coder': {
        contextWindow: 64_000,
        maxTokens: 8_000,
        vision: false,
    },
}

export const deepSeekModels = Object.keys(modelConfig)

interface Options {
    deepseekAPIKey: string
    deepseekModel: string
    temperature: number
}

export default class DeepSeek extends Base {
    public name = 'DeepSeek'

    public options: Options
    constructor(options: Options) {
        super()
        this.options = options
    }

    async callChatCompletion(
        rawMessages: Message[],
        signal?: AbortSignal,
        onResultChange?: onResultChange
    ): Promise<string> {
        const messages = await populateOpenAIMessageText(rawMessages)
        const response = await this.post(
            `https://api.deepseek.com/v1/chat/completions`,
            this.getHeaders(),
            {
                messages,
                model: this.options.deepseekModel,
                temperature: this.options.temperature,
                stream: true,
            },
            {
                signal,
                useProxy: platform.type !== 'desktop',
            }
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
            Authorization: `Bearer ${this.options.deepseekAPIKey}`,
            'Content-Type': 'application/json',
        }
        return headers
    }

    // https://api-docs.deepseek.com/zh-cn/api/list-models
    async listModels(): Promise<string[]> {
        type Response = {
            object: 'list'
            data: {
                id: string
                object: 'model'
                owned_by: string
            }[]
        }
        const res = await this.get(
            `https://api.deepseek.com/models`,
            this.getHeaders(),
            {
                useProxy: platform.type !== 'desktop',
            },
        )
        const json: Response = await res.json()
        if (!json['data']) {
            throw new ApiError(JSON.stringify(json))
        }
        return json.data.map((item) => item.id)
    }
}
