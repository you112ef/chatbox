import { Message } from 'src/shared/types'
import { ApiError, NetworkError, AIProviderNoImplementedPaintError, BaseError, AIProviderNoImplementedChatError } from './errors'
import { createParser } from 'eventsource-parser'
import _ from 'lodash'
import storage from '@/storage'

export default class Base {
    public name = 'Unknown'

    constructor() {
    }

    async callImageGeneration(prompt: string, signal?: AbortSignal): Promise<string> {
        throw new AIProviderNoImplementedPaintError(this.name)
    }

    async callChatCompletion(messages: Message[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        throw new AIProviderNoImplementedChatError(this.name)
    }

    async chat(messages: Message[], onResultUpdated?: (data: { text: string, cancel(): void }) => void): Promise<string> {
        messages = await this.preprocessMessage(messages)
        return await this._chat(messages, onResultUpdated)
    }

    protected async _chat(messages: Message[], onResultUpdated?: (data: { text: string, cancel(): void }) => void): Promise<string> {
        // 初始化 fetch 的取消机制
        let canceled = false
        const controller = new AbortController()
        const cancel = () => {
            canceled = true
            controller.abort()
        }
        let result = ''
        try {
            // 支持 onResultUpdated 回调
            let onResultChange: onResultChange | undefined = undefined
            if (onResultUpdated) {
                onResultUpdated({ text: result, cancel })    // 这里先传递 cancel 方法
                onResultChange = (newResult: string) => {
                    result = newResult
                    onResultUpdated({ text: result, cancel })
                }
            }
            // 调用各个模型提供商的底层接口方法
            result = await this.callChatCompletion(messages, controller.signal, onResultChange)
        } catch (error) {
            /// 处理 fetch 被取消的情况
            // if a cancellation is performed
            // do not throw an exception
            // otherwise the content will be overwritten.
            if (canceled) {
                return result
            }
            // 如果不是取消，那么正常抛出错误
            throw error
        }
        return result
    }

    async preprocessMessage(messages: Message[]): Promise<Message[]> {
        // messages = _.cloneDeep(messages)    // 直接修改会影响到原始数据
        // return this.populateMessagesWithFiles(messages)
        return messages
    }

    async paint(prompt: string, num: number, callback?: (picBase64: string) => any, signal?: AbortSignal): Promise<string[]> {
        const concurrence: Promise<string>[] = []
        for (let i = 0; i < num; i++) {
            concurrence.push(
                this.callImageGeneration(prompt, signal)
                    .then((picBase64) => {
                        if (callback) {
                            callback(picBase64)
                        }
                        return picBase64
                    })
            )
        }
        return await Promise.all(concurrence)
    }

    async handleSSE(response: Response, onMessage: (message: string) => void) {
        // 状态码不在 200～299 之间，一般是接口报错了
        if (!response.ok) {
            const errJson = await response.json().catch(() => null)
            throw new ApiError(errJson ? JSON.stringify(errJson) : `${response.status} ${response.statusText}`)
        }
        if (!response.body) {
            throw new Error('No response body')
        }
        const parser = createParser((event) => {
            if (event.type === 'event') {
                onMessage(event.data)
            }
        })
        for await (const chunk of this.iterableStreamAsync(response.body)) {
            const str = new TextDecoder().decode(chunk)
            parser.feed(str)
        }
    }

    async handleNdjson(response: Response, onMessage: (message: string) => void) {
        // 状态码不在 200～299 之间，一般是接口报错了
        if (!response.ok) {
            const errJson = await response.json().catch(() => null)
            throw new ApiError(errJson ? JSON.stringify(errJson) : `${response.status} ${response.statusText}`)
        }
        if (!response.body) {
            throw new Error('No response body')
        }
        let buffer = ''
        for await (const chunk of this.iterableStreamAsync(response.body)) {
            let data = new TextDecoder().decode(chunk)
            buffer = buffer + data
            let lines = buffer.split('\n')
            if (lines.length <= 1) {
                continue
            }
            buffer = lines[lines.length - 1]
            lines = lines.slice(0, -1)
            for (const line of lines) {
                if (line.trim() !== '') {
                    onMessage(line)
                }
            }
        }
    }

    async * iterableStreamAsync(stream: ReadableStream): AsyncIterableIterator<Uint8Array> {
        const reader = stream.getReader()
        try {
            while (true) {
                const { value, done } = await reader.read()
                if (done) {
                    return
                } else {
                    yield value
                }
            }
        } finally {
            reader.releaseLock()
        }
    }

    async post(
        url: string,
        headers: Record<string, string>,
        body: Record<string, any>,
        signal?: AbortSignal,
        retry = 3
    ) {
        let requestError: ApiError | NetworkError | null = null
        for (let i = 0; i < retry + 1; i++) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal,
                })
                // 状态码不在 200～299 之间，一般是接口报错了，这里也需要抛错后重试
                if (!res.ok) {
                    const err = await res.text().catch((e) => null)
                    throw new ApiError(`Status Code ${res.status}, ${err}`)
                }
                return res
            } catch (e) {
                if (e instanceof BaseError) {
                    requestError = e
                } else {
                    const err = e as Error
                    const origin = new URL(url).origin
                    requestError = new NetworkError(err.message, origin)
                }
                await new Promise((resolve) => setTimeout(resolve, 500))
            }
        }
        if (requestError) {
            throw requestError
        } else {
            throw new Error('Unknown error')
        }
    }

    async get(
        url: string,
        headers: Record<string, string>,
        signal?: AbortSignal,
        retry = 3
    ) {
        let requestError: ApiError | NetworkError | null = null
        for (let i = 0; i < retry + 1; i++) {
            try {
                const res = await fetch(url, {
                    method: 'GET',
                    headers,
                    signal,
                })
                // 状态码不在 200～299 之间，一般是接口报错了，这里也需要抛错后重试
                if (!res.ok) {
                    const err = await res.text().catch((e) => null)
                    throw new ApiError(`Status Code ${res.status}, ${err}`)
                }
                return res
            } catch (e) {
                if (e instanceof BaseError) {
                    requestError = e
                } else {
                    const err = e as Error
                    const origin = new URL(url).origin
                    requestError = new NetworkError(err.message, origin)
                }
            }
        }
        if (requestError) {
            throw requestError
        } else {
            throw new Error('Unknown error')
        }
    }

    // async populateMessagesWithFiles(messages: Message[]): Promise<Message[]> {
    //     for (const message of messages) {
    //         if (!message.files || message.files.length === 0) {
    //             continue
    //         }
    //         for (const [i, file] of Object.entries(message.files)) {
    //             if (!file.storageKey) {
    //                 continue
    //             }
    //             const content = await storage.getBlob(file.storageKey)
    //             if (! content) {
    //                 continue
    //             }
    //             message.content += `\n\n<ATTACHMENT_FILE>\n`
    //             message.content += `<FILE_INDEX>File ${i+1}</FILE_INDEX>\n`
    //             message.content += `<FILE_NAME>${file.name}</FILE_NAME>\n`
    //             message.content += '<FILE_CONTENT>\n'
    //             message.content += content + '\n'
    //             message.content += '</FILE_CONTENT>\n'
    //             message.content += `</ATTACHMENT_FILE>\n`
    //         }
    //         console.log(message.content)
    //     }
    //     return messages
    // }

    /**
     * SequenceMessages organizes and orders messages to follow the sequence: system -> user -> assistant -> user -> etc.
     * 这个方法只能用于 llm 接口请求前的参数构造，因为会过滤掉消息中的无关字段，所以不适用于其他消息存储的场景
     * 这个方法本质上是 golang API 服务中方法的 TypeScript 实现
     * @param msgs 
     * @returns 
     */
    public sequenceMessages(msgs: Message[]): Message[] {
        // Merge all system messages first
        let system: Message = {
            id: '',
            role: 'system',
            content: "",
        };
        for (let msg of msgs) {
            if (msg.role === 'system') {
                system = this.mergeMessages(system, msg);
            }
        }
        // Initialize the result array with the non-empty system message, if present
        let ret: Message[] = this.isMessageEmpty(system) ? [] : [system];
        let next: Message = {
            id: '',
            role: 'user',
            content: "",
        };
        let isFirstUserMsg = true; // Special handling for the first user message
        for (let msg of msgs) {
            // Skip the already processed system messages or empty messages
            if (msg.role === 'system' || this.isMessageEmpty(msg)) {
                continue;
            }
            // Merge consecutive messages from the same role
            if (msg.role === next.role) {
                next = this.mergeMessages(next, msg);
                continue;
            }
            // Merge all assistant messages as a quote block if constructing the first user message
            if (this.isMessageEmpty(next) && isFirstUserMsg && msg.role === 'assistant') {
                let quote = msg.content.split("\n").map(line => `> ${line}`).join("\n") + "\n";
                msg.content = quote;
                next = this.mergeMessages(next, msg);
                continue;
            }
            // If not the first user message, add the current message to the result and start a new one
            if (!this.isMessageEmpty(next)) {
                ret.push(next);
                isFirstUserMsg = false;
            }
            next = msg;
        }
        // Add the last message if it's not empty
        if (!this.isMessageEmpty(next)) {
            ret.push(next);
        }
        // If there's only one system message, convert it to a user message
        if (ret.length === 1 && ret[0].role === 'system') {
            ret[0].role = 'user';
        }
        return ret;
    }

    public isMessageEmpty(m: Message): boolean {
        return m.content === '' && (m.pictures || []).length === 0
    }

    public mergeMessages(a: Message, b: Message): Message {
        const ret = { ...a }
        if (ret.content != "") {
            ret.content += "\n\n"
        }
        ret.content += b.content
        if (a.pictures || b.pictures) {
            ret.pictures = a.pictures ? a.pictures.concat(b.pictures || []) : b.pictures
        }
        return ret
    }
}

export type onResultChange = (result: string) => void
