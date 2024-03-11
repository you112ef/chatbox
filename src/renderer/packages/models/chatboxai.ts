import { ChatboxAILicenseDetail, ChatboxAIModel, Message, OpenAIRoleEnumType } from 'src/shared/types'
import Base from './base'
import { API_ORIGIN } from '../remote'
import { ApiError } from './errors'
import { onResultChange } from './interfaces'
import storage from '@/storage'

export const chatboxAIModels: ChatboxAIModel[] = ['chatboxai-3.5', 'chatboxai-4']

interface Options {
    licenseKey?: string
    chatboxAIModel?: ChatboxAIModel
    licenseInstances?: {
        [key: string]: string
    }
    licenseDetail?: ChatboxAILicenseDetail
    language: string
    dalleStyle: 'vivid' | 'natural'
    temperature: number
}

interface Config {
    uuid: string
}

export default class ChatboxAI extends Base {
    public name = 'ChatboxAI'

    public options: Options
    public config: Config
    constructor(options: Options, config: Config) {
        super()
        this.options = options
        this.config = config
    }

    async callImageGeneration(prompt: string, signal?: AbortSignal): Promise<string> {
        const res = await this.post(
            `${API_ORIGIN}/api/ai/paint`,
            this.getHeaders(),
            {
                prompt,
                response_format: 'b64_json',
                style: this.options.dalleStyle,
                uuid: this.config.uuid,
                language: this.options.language,
            },
            signal
        )
        const json = await res.json()
        return json['data'][0]['b64_json']
    }

    async callChatCompletion(rawMessages: Message[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        const messages = await populateChatboxAIMessage(rawMessages)
        const response = await this.post(
            `${API_ORIGIN}/api/ai/chat`,
            this.getHeaders(),
            {
                uuid: this.config.uuid,
                model: this.options.chatboxAIModel || 'chatboxai-3.5',
                messages,
                // max_tokens: maxTokensNumber,
                temperature: this.options.temperature,
                language: this.options.language,
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
                throw new ApiError(`Error from Chatbox AI: ${JSON.stringify(data)}`)
            }
            const word = data.choices[0]?.delta?.content
            if (word !== undefined) {
                result += word
                if (onResultChange) {
                    onResultChange(result)
                }
            }
        })
        return result
    }

    getHeaders() {
        const license = this.options.licenseKey || ''
        const instanceId = (this.options.licenseInstances ? this.options.licenseInstances[license] : '') || ''
        const headers: Record<string, string> = {
            Authorization: license,
            'Instance-Id': instanceId,
            'Content-Type': 'application/json',
        }
        return headers
    }
}

// Chatbox AI 服务接收的消息格式
export interface ChatboxAIMessage {
    role: OpenAIRoleEnumType
    content: string
    pictures?: {
        base64?: string
    }[]
}

export async function populateChatboxAIMessage(rawMessages: Message[]): Promise<ChatboxAIMessage[]> {
    // 将 Message 转换为 OpenAIMessage，清理掉会报错的多余的字段
    const messages: ChatboxAIMessage[] = []
    for (const raw of rawMessages) {
        const newMessage: ChatboxAIMessage = {
            role: raw.role,
            content: raw.content,
        }
        for (const p of (raw.pictures || [])) {
            if (!p.storageKey) {
                continue
            }
            const base64 = await storage.getBlob(p.storageKey)
            if (!base64) {
                continue
            }
            if (! newMessage.pictures) {
                newMessage.pictures = []
            }
            newMessage.pictures.push({ base64 })
        }
        messages.push(newMessage)
    }
    return messages
}
