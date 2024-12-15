import { Message } from 'src/shared/types'
import Base, { onResultChange } from './base'
import { ApiError } from './errors'
import { get } from 'lodash'
import storage from '@/storage'
import platform from '@/platform'
import * as base64 from '@/packages/base64'
import * as defaults from 'src/shared/defaults'

// 官方 SDK 明确声明用于 Node.js，在浏览器中会导致页面白屏。
// import Anthropic from '@anthropic-ai/sdk'
// import { MessageParam } from '@anthropic-ai/sdk/resources'

export type ClaudeModel = keyof typeof modelConfig

// https://docs.anthropic.com/claude/docs/models-overview
export const modelConfig = {
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
    },
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

    async callChatCompletion(
        rawMessages: Message[],
        signal?: AbortSignal,
        onResultChange?: onResultChange
    ): Promise<string> {
        // 经过测试，Bedrock Claude 3 的消息必须以 user 角色开始，并且 user 和 assistant 角色必须交替出现，否则都会出现回答异常
        rawMessages = this.sequenceMessages(rawMessages)

        let prompt = ''
        const messages: ClaudeMessage[] = []
        for (const msg of rawMessages) {
            if (msg.role === 'system') {
                // 系统消息追加到 prompt 中
                prompt += msg.content + '\n'
            } else {
                // 用户消息追加到 messages 中
                const newMessage: ClaudeMessage = { role: msg.role, content: [] }
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
        const extraHeaders: Record<string, string> = {}

        const response = await this.post(
            url,
            {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
                'x-api-key': this.options.claudeApiKey,
                ...extraHeaders,
            },
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
                signal: signal,
                useProxy:
                    platform.type !== 'desktop' && this.options.claudeApiHost === defaults.settings().claudeApiHost,
            }
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
                    onResultChange({ content: result })
                }
            }
        })
        return result
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
