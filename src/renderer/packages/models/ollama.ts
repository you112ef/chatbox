import { Message } from 'src/shared/types'
import Base, { onResultChange } from './base'
import { ApiError } from './errors'
import storage from '@/storage'
import * as base64 from '@/packages/base64'

// 也可以考虑官方库
// import ollama from 'ollama/browser'

interface Options {
    ollamaHost: string
    ollamaModel: string
    temperature: number
}

export default class Ollama extends Base {
    public name = 'Ollama'

    public options: Options
    constructor(options: Options) {
        super()
        this.options = options
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

    async callChatCompletion(rawMessages: Message[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        // https://github.com/ollama/ollama/blob/main/docs/api.md#chat-request-with-images
        const messages = await Promise.all(rawMessages.map(async (m) => {
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
        }))
        const res = await this.post(
            `${this.getHost()}/api/chat`,
            { 'Content-Type': 'application/json' },
            {
                model: this.options.ollamaModel,
                messages,
                stream: true,
                options: {
                    temperature: this.options.temperature,
                }
            },
            signal,
        )
        let result = ''
        await this.handleNdjson(res, (message) => {
            const data = JSON.parse(message)
            if (data['done']) {
                return
            }
            const word = data['message']?.['content']
            if (! word) {
                throw new ApiError(JSON.stringify(data))
            }
            result += word
            if (onResultChange) {
                onResultChange(result)
            }
        })
        return result
    }

    async listModels(): Promise<string[]> {
        const res = await this.get(`${this.getHost()}/api/tags`, {})
        const json = await res.json()
        if (! json['models']) {
            throw new ApiError(JSON.stringify(json))
        }
        return json['models'].map((m: any) => m['name'])
    }
}
