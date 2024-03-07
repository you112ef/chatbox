import { OpenAIMessage } from 'src/shared/types'
import Base from './base'
import { ApiError } from './errors'
import { onResultChange } from './interfaces'

export type ClaudeModel = 'claude-instant-1' | 'claude-1' | 'claude-instant-1-100k' | 'claude-1-100k' | 'claude-2' | 'claude-2.1' | 'claude-instant-1.2'

export const claudeModels: ClaudeModel[] = [
    'claude-instant-1',
    'claude-instant-1.2',
    'claude-2',
    'claude-2.1',
    'claude-1',
    'claude-instant-1-100k',
    'claude-1-100k',
]

interface Options {
    claudeApiKey: string
    claudeModel: string
}

export default class Claude extends Base {
    public name = 'Claude'

    public options: Options
    constructor(options: Options) {
        super()
        this.options = options
    }

    async callChatCompletion(messages: OpenAIMessage[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        // "\n\nHuman: Hello, world!\n\nAssistant:"
        let prompt = messages
            .map((m) => (m.role !== 'assistant' ? `Human: ${m.content}` : `Assistant: ${m.content}`))
            .join('\n\n')
        prompt += '\n\nAssistant:'
        const response = await this.post(
            'https://api.anthropic.com/v1/complete',
            {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
                'x-api-key': this.options.claudeApiKey,
            },
            {
                model: this.options.claudeModel,
                prompt: prompt,
                max_tokens_to_sample: 100_000,
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
                let word: string = data.completion
                if (word !== undefined) {
                    result += word
                    if (onResultChange) {
                        onResultChange(result.trimStart())
                    }
                }
            }
        )
        return result.trimStart()
    }
}
