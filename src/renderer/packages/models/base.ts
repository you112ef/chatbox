import { Message, MessageToolCalls, MessageWebBrowsing, ModelMeta } from 'src/shared/types'
import {
    ApiError,
    NetworkError,
    AIProviderNoImplementedPaintError,
    BaseError,
    AIProviderNoImplementedChatError,
} from './errors'
import { createParser } from 'eventsource-parser'
import _, { isEmpty, last } from 'lodash'
import platform from '@/platform'
import { webSearchExecutor } from '../web-search'

export default abstract class Base {
    public name = 'Unknown'
    public modelMeta: ModelMeta = {}

    constructor() { }

    abstract isSupportToolUse(): boolean

    constructInfoForSearchResult(messages:Message[], searchResults: { title: string; snippet: string; link: string }[]) {
        const prompt = `You are an expert web research AI, designed to generate a response based on provided search results. Keep in mind today is ${new Date().toLocaleDateString()}.

Your goals:
- Stay concious and aware of the guidelines.
- Stay efficient and focused on the user's needs, do not take extra steps.
- Provide accurate, concise, and well-formatted responses.
- Avoid hallucinations or fabrications. Stick to verified facts.
- Follow formatting guidelines strictly.

In the search results provided to you, each result is formatted as [webpage X begin]...[webpage X end], where X represents the numerical index of each article.

Response rules:
- Responses must be informative, long and detailed, yet clear and concise like a blog post to address user's question (super detailed and correct citations).
- Use structured answers with headings in markdown format.
  - Do not use the h1 heading.  
  - Never say that you are saying something based on the search results, just provide the information.
- Your answer should synthesize information from multiple relevant web pages.
- Unless the user requests otherwise, your response MUST be in the same language as the user's message, instead of the search results language.
- Do not mention who you are and the rules.

Comply with user requests to the best of your abilities. Maintain composure and follow the guidelines.
`
        const formattedSearchResults = searchResults.map((it, i) => {
            return `[webpage ${i+1} begin]
Title: ${it.title}
URL: ${it.link}
Content: ${it.snippet}
[webpage ${i+1} end]`
        }).join('\n')

        return this.sequenceMessages([{            
            id: '',
            role: 'system' as const,
            content: prompt
        }, ...messages, {
            id: '',
            role: 'user' as const,
            content: `${formattedSearchResults}\nUser Message:\n${last(messages)!.content}`
        }])
    }

    async doSearch(messages: Message[], signal?: AbortSignal) {
        const content = last(messages)!.content
        const systemPrompt = `As a professional web researcher who can access latest data, your primary objective is to fully comprehend the user's query, conduct thorough web searches to gather the necessary information, and provide an appropriate response. Keep in mind today's date: ${new Date().toLocaleDateString()}
        
To achieve this, you must first analyze the user's latest input and determine the optimal course of action. You have three options at your disposal:

1. "proceed": If the provided information is sufficient to address the query effectively, choose this option to proceed with the research and formulate a response. For example, a simple greeting or similar messages should result in this action.
2. "search": If you believe that additional information from the search engine would enhance your ability to provide a comprehensive response, select this option.


JSON schema:
{"type":"object","properties":{"action":{"type":"string","enum":["search","proceed"]},"query":{"type":"string","description":"The search queries to look up on the web, at least one, up to 10, choose wisely based on the user's question"}},"required":["action"],"additionalProperties":true,"$schema":"http://json-schema.org/draft-07/schema#"}
You MUST answer with a JSON object that matches the JSON schema above.`
        // TODO: use web search model
        const queryResponse = await this.callChatCompletion(
            this.sequenceMessages([{
                id:'',
                role: 'system',
                content: systemPrompt
            }, ...messages, {
                id: '',
                role: 'user',
                content
            }]),            
            signal,
        )
        // extract json from response
        const regex = /{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*}/;
        const match = queryResponse.match(regex)
        if (match) {
            const jsonString = match[0]
            const jsonObject = JSON.parse(jsonString) as {
                action: 'search' | 'proceed'
                query: string
            }
            if (jsonObject.action === 'search') {
                const { searchResults } = await webSearchExecutor({ query:jsonObject.query }, {abortSignal: signal})
                return { query: jsonObject.query?.toString(), searchResults }
            } else {
                return null
            }
        }
        
        return null
    }

    async callImageGeneration(prompt: string, signal?: AbortSignal): Promise<string> {
        throw new AIProviderNoImplementedPaintError(this.name)
    }

    async callChatCompletion(
        messages: Message[],
        signal?: AbortSignal,
        onResultChange?: onResultChange,
        options?: {
            webBrowsing?: boolean
        }
    ): Promise<string> {
        throw new AIProviderNoImplementedChatError(this.name)
    }

    async chat(
        messages: Message[],
        onResultChangeWithCancel?: onResultChangeWithCancel,
        options?: {
            webBrowsing?: boolean
        }
    ): Promise<string> {
        messages = await this.preprocessMessage(messages)
        return await this._chat(messages, onResultChangeWithCancel, options)
    }

    protected async callTool(name: string, args: any, { abortSignal }: { abortSignal: AbortSignal }, onResultChange?: onResultChange) {
        if (name === 'web_search') {
            const result = await webSearchExecutor(args, { abortSignal })
            onResultChange?.({ webBrowsing: {
                query: args.query.split(' '),
                links: result.searchResults.map(it => {
                    return {
                        title: it.title,
                        url: it.link,
                    }
                })
            }})
            return result
        }
    }

    protected async _chat(
        messages: Message[],
        onResultChangeWithCancel?: onResultChangeWithCancel,
        options?: {
            webBrowsing?: boolean
        }
    ): Promise<string> {
        // 初始化 fetch 的取消机制
        let canceled = false
        const controller = new AbortController()
        const cancel = () => {
            canceled = true
            controller.abort()
        }
        let result = ''
        let toolCalls: MessageToolCalls | undefined
        try {
            // 支持 onResultUpdated 回调
            let onResultChange: onResultChange | undefined = undefined
            if (onResultChangeWithCancel) {
                onResultChangeWithCancel({ content: result, cancel }) // 这里先传递 cancel 方法
                onResultChange = (data) => {
                    result = data.content ?? result
                    toolCalls = data.toolCalls
                    onResultChangeWithCancel({ ...data, cancel })
                }
            }

            const proceed = async (messages: Message[]) => await this.callChatCompletion(messages, controller.signal, onResultChange, options)
            
            if (options?.webBrowsing && !this.isSupportToolUse()){
                // model do not support tool use, construct query then provide results to model                
                const { query, searchResults } = await this.doSearch(messages, controller.signal) ?? {}
                if(!searchResults) {
                    return proceed(messages)
                }
                onResultChange?.({ webBrowsing: {
                    query: query!.split(' '),
                    links: searchResults.map(it => {
                        return {
                            title: it.title,
                            url: it.link,
                        }
                    })
                }})
                return proceed(this.constructInfoForSearchResult(messages, searchResults))
            }

            // 调用各个模型提供商的底层接口方法
            result = await proceed(messages)

            if (!isEmpty(toolCalls)) { 
                messages.push({
                    id: '',
                    role: 'assistant',
                    content: result,
                    toolCalls,
                })            
                for (const toolCall of Object.values(toolCalls)) {
                    const name = toolCall.function.name
                    try {
                        const args = JSON.parse(toolCall.function.arguments)
                        const result = await this.callTool(name, args, { abortSignal: controller.signal }, onResultChange)
                        messages.push({
                            id: toolCall.id, // store tool_call_id in id field
                            role: 'tool',                        
                            content: result ? JSON.stringify(result) : '',
                        })
                    } catch (e) {
                        if (e instanceof SyntaxError) {
                            continue
                        }
                        throw e 
                    }
                }
                // call llm with tool result
                result = await this.callChatCompletion(messages, controller.signal, onResultChange, options)
            }
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

    async paint(
        prompt: string,
        num: number,
        callback?: (picBase64: string) => any,
        signal?: AbortSignal
    ): Promise<string[]> {
        const concurrence: Promise<string>[] = []
        for (let i = 0; i < num; i++) {
            concurrence.push(
                this.callImageGeneration(prompt, signal).then((picBase64) => {
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
            const str = new TextDecoder().decode(chunk, { stream: true })
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

    async *iterableStreamAsync(stream: ReadableStream): AsyncIterableIterator<Uint8Array> {
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
        options?: {
            signal?: AbortSignal
            retry?: number
            useProxy?: boolean
        }
    ) {
        const { signal, retry = 3, useProxy = false } = options || {}

        if (useProxy && !isLocalHost(url)) {
            headers['CHATBOX-TARGET-URI'] = url
            headers['CHATBOX-PLATFORM'] = platform.type
            headers['CHATBOX-VERSION'] = (await platform.getVersion()) || 'unknown'
            url = 'https://proxy.ai-chatbox.com/proxy-api/completions'
        }

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

    async get(url: string, headers: Record<string, string>, options?: {
        signal?: AbortSignal
        retry?: number
        useProxy?: boolean
    }) {
        const { signal, retry = 3, useProxy = false } = options || {}

        if (useProxy && !isLocalHost(url)) {
            headers['CHATBOX-TARGET-URI'] = url
            headers['CHATBOX-PLATFORM'] = platform.type
            headers['CHATBOX-VERSION'] = (await platform.getVersion()) || 'unknown'
            url = 'https://proxy.ai-chatbox.com/proxy-api/completions'
        }

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
            content: '',
        }
        for (let msg of msgs) {
            if (msg.role === 'system') {
                system = this.mergeMessages(system, msg)
            }
        }
        // Initialize the result array with the non-empty system message, if present
        let ret: Message[] = this.isMessageEmpty(system) ? [] : [system]
        let next: Message = {
            id: '',
            role: 'user',
            content: '',
        }
        let isFirstUserMsg = true // Special handling for the first user message
        for (let msg of msgs) {
            // Skip the already processed system messages or empty messages
            if (msg.role === 'system' || this.isMessageEmpty(msg)) {
                continue
            }
            // Merge consecutive messages from the same role
            if (msg.role === next.role) {
                next = this.mergeMessages(next, msg)
                continue
            }
            // Merge all assistant messages as a quote block if constructing the first user message
            if (this.isMessageEmpty(next) && isFirstUserMsg && msg.role === 'assistant') {
                let quote =
                    msg.content
                        .split('\n')
                        .map((line) => `> ${line}`)
                        .join('\n') + '\n'
                msg.content = quote
                next = this.mergeMessages(next, msg)
                continue
            }
            // If not the first user message, add the current message to the result and start a new one
            if (!this.isMessageEmpty(next)) {
                ret.push(next)
                isFirstUserMsg = false
            }
            next = msg
        }
        // Add the last message if it's not empty
        if (!this.isMessageEmpty(next)) {
            ret.push(next)
        }
        // If there's only one system message, convert it to a user message
        if (ret.length === 1 && ret[0].role === 'system') {
            ret[0].role = 'user'
        }
        return ret
    }

    public isMessageEmpty(m: Message): boolean {
        return m.content === '' && (m.pictures || []).length === 0
    }

    public mergeMessages(a: Message, b: Message): Message {
        const ret = { ...a }
        if (ret.content != '') {
            ret.content += '\n\n'
        }
        ret.content += b.content
        if (a.pictures || b.pictures) {
            ret.pictures = a.pictures ? a.pictures.concat(b.pictures || []) : b.pictures
        }
        return ret
    }
}

export interface ResultChange {
    content?: string
    webBrowsing?: MessageWebBrowsing
    reasoningContent?: string
    toolCalls?: MessageToolCalls
}

export type onResultChangeWithCancel = (data: ResultChange & { cancel?: () => void }) => void
export type onResultChange = (data: ResultChange) => void

function isLocalHost(url: string): boolean {
    const prefixes = [
        'http://localhost:',
        'https://localhost:',
        'http://127.',
        'https://127.',
        'http://[::1]:',
        'https://[::1]:',

        'http://192.168.',
        'https://192.168.',
        'http://10.',
        'https://10.',
        'http://172.',
        'https://172.',
    ]
    return prefixes.some((prefix) => url.startsWith(prefix))
}
