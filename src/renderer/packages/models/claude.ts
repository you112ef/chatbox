import { OpenAIMessage } from 'src/shared/types'
import Base from './base'
import { onResultChange } from './interfaces'
import Anthropic from '@anthropic-ai/sdk'
import { MessageParam } from '@anthropic-ai/sdk/resources'
import { ApiError, NetworkError } from './errors'

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
        const anthropic = new Anthropic({
            baseURL: this.options.claudeApiHost,
            apiKey: this.options.claudeApiKey,
        })

        let prompt = ''
        const messages: MessageParam[] = []
        for (const msg of rawMessages) {
            if (msg.role === 'system') {
                prompt += msg.content + '\n'
            } else {
                messages.push({ role: msg.role, content: msg.content })
            }
        }

        try {
            let result = ''
            const stream = anthropic.messages
                .stream({
                    model: this.options.claudeModel,
                    max_tokens: modelConfig[this.options.claudeModel]   // 兼容旧版本的问题（不一定存在）
                        ? modelConfig[this.options.claudeModel].maxOutput
                        : 4096,
                    system: prompt,
                    messages: messages,
                }, { signal: signal }).on('text', (text) => {
                    result += text
                    if (onResultChange) {
                        onResultChange(result)
                    }
                });
            await stream.finalMessage();
            // return message.content[0].text
            return result
        } catch (e) {
            if (e instanceof Anthropic.APIConnectionError) {
                throw new NetworkError(e.message, this.options.claudeApiHost)
            } else {
                throw new ApiError((e as any).message)
            }
        }
    }
}
