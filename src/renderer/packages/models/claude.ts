import { OpenAIMessage } from 'src/shared/types'
import Base from './base'
import { onResultChange } from './interfaces'
import { ApiError } from './errors'
import { get } from 'lodash'

// 官方 SDK 明确声明用于 Node.js，在浏览器中会导致页面白屏。
// import Anthropic from '@anthropic-ai/sdk'
// import { MessageParam } from '@anthropic-ai/sdk/resources'

export type ClaudeModel = keyof typeof modelConfig

// https://docs.anthropic.com/claude/docs/models-overview
export const modelConfig = {
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

    // 以下模型的配置待确认，因为文档中没有提到
    'claude-2': {
        contextWindow: 100_000,
        maxOutput: 4096,
        vision: false,
    },
    'claude-instant-1': {
        contextWindow: 100_000,
        maxOutput: 4096,
        vision: false,
    },
    'claude-1': {
        contextWindow: 100_000,
        maxOutput: 4096,
        vision: false,
    },
    'claude-instant-1-100k': {
        contextWindow: 100_000,
        maxOutput: 4096,
        vision: false,
    },
    'claude-1-100k': {
        contextWindow: 100_000,
        maxOutput: 4096,
        vision: false,
    }
}

export const claudeModels: ClaudeModel[] = Object.keys(modelConfig) as ClaudeModel[]

interface Options {
    claudeApiKey: string
    claudeApiHost: string
    claudeModel: ClaudeModel
}

export default class Claude extends Base {
    public name = 'Claude'

    public options: Options
    constructor(options: Options) {
        super()
        this.options = options
    }

    async callChatCompletion(rawMessages: OpenAIMessage[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        let prompt = ''
        const messages: Message[] = []
        for (const msg of rawMessages) {
            if (msg.role === 'system') {
                prompt += msg.content + '\n'
            } else {
                messages.push({
                    role: msg.role,
                    content: [ { text: msg.content, type: 'text' } ]
                })
            }
        }
        const response = await this.post(
            `${this.options.claudeApiHost}/v1/messages`,
            {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
                'x-api-key': this.options.claudeApiKey,
            },
            {
                model: this.options.claudeModel,
                max_tokens: modelConfig[this.options.claudeModel]   // 兼容旧版本的问题（不一定存在）
                    ? modelConfig[this.options.claudeModel].maxOutput
                    : 4096,
                system: prompt,
                messages: messages,
                stream: true,
            },
            signal
        )
        let result = ''
        await this.handleSSE(response, (message) => {
            const data = JSON.parse(message)
            if (data.error) {
                throw new ApiError(`Error from Claude: ${JSON.stringify(data)}`)
            }
            const word: string = get(data, 'delta.text', '')
            if (word) {
                result += word
                if (onResultChange) {
                    onResultChange(result)
                }
            }
        })
        return result
    }
}

export interface Message {
    role: 'assistant' | 'user'
    content: {
        text: string
        type: 'text'
    }[]

}
