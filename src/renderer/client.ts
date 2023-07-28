import { Config, Message, ModelProvider, OpenAIMessage, Settings } from '../shared/types'
import * as utils from './utils'
import { createParser } from 'eventsource-parser'

export interface OnTextCallbackResult {
    // response content
    text: string
    // cancel for fetch
    cancel: () => void
}

export class ApiError extends Error {
    constructor(message: string) {
        super('API Error: ' + message)
    }
}

export class NetworkError extends Error {
    public host: string
    constructor(message: string, host: string) {
        super('Network Error: ' + message)
        this.host = host
    }
}

export async function reply(
    setting: Settings,
    config: Config,
    messageContext: Message[],
    onText?: (option: OnTextCallbackResult) => void
): Promise<string> {
    let hasCancel = false // fetch has been canceled
    const controller = new AbortController() // abort signal for fetch
    const cancel = () => {
        hasCancel = true
        controller.abort()
    }

    let fullText = ''
    try {
        const messages: OpenAIMessage[] = messageContext.map((m) => ({
            role: m.role,
            content: m.content,
        }))
        switch (setting.aiProvider) {
            case ModelProvider.ChatboxAI:
                const license = setting.licenseKey || ''
                const instanceId = (setting.licenseInstances ? setting.licenseInstances[license] : '') || ''
                await requestChatboxAI(
                    {
                        license: license,
                        instanceId: instanceId,
                        uuid: config.uuid,
                        // maxTokensNumber: maxTokensNumber,
                        temperature: setting.temperature,
                        messages,
                        signal: controller.signal,
                    },
                    (message) => {
                        if (message === '[DONE]') {
                            return
                        }
                        const data = JSON.parse(message)
                        if (data.error) {
                            throw new ApiError(`Error from Chatbox AI: ${JSON.stringify(data)}`)
                        }
                        const text = data.choices[0]?.delta?.content
                        if (text !== undefined) {
                            fullText += text
                            if (onText) {
                                onText({ text: fullText, cancel })
                            }
                        }
                    }
                )
                break
            case ModelProvider.OpenAI:
                await requestOpenAI(
                    {
                        host: setting.apiHost,
                        apiKey: setting.openaiKey,
                        modelName: setting.model,
                        maxTokensNumber: setting.openaiMaxTokens === 0 ? undefined : setting.openaiMaxTokens,
                        temperature: setting.temperature,
                        messages,
                        signal: controller.signal,
                    },
                    (message) => {
                        if (message === '[DONE]') {
                            return
                        }
                        const data = JSON.parse(message)
                        if (data.error) {
                            throw new ApiError(`Error from OpenAI: ${JSON.stringify(data)}`)
                        }
                        const text = data.choices[0]?.delta?.content
                        if (text !== undefined) {
                            fullText += text
                            if (onText) {
                                onText({ text: fullText, cancel })
                            }
                        }
                    }
                )
                break
            case ModelProvider.Azure:
                await requestAzure(
                    {
                        endpoint: setting.azureEndpoint,
                        deploymentName: setting.azureDeploymentName,
                        apikey: setting.azureApikey,
                        modelName: setting.model,
                        messages,
                        maxTokensNumber: setting.openaiMaxTokens === 0 ? undefined : setting.openaiMaxTokens,
                        temperature: setting.temperature,
                        signal: controller.signal,
                    },
                    (message) => {
                        if (message === '[DONE]') {
                            return
                        }
                        const data = JSON.parse(message)
                        if (data.error) {
                            throw new ApiError(`Error from Azure OpenAI: ${JSON.stringify(data)}`)
                        }
                        const text = data.choices[0]?.delta?.content
                        if (text !== undefined) {
                            fullText += text
                            if (onText) {
                                onText({ text: fullText, cancel })
                            }
                        }
                    }
                )
                break
            case ModelProvider.ChatGLM6B:
                await requestChatGLM6B(
                    {
                        url: setting.chatglm6bUrl,
                        messages,
                        temperature: setting.temperature,
                        signal: controller.signal,
                    },
                    (message) => {
                        fullText = message
                        if (onText) {
                            onText({ text: fullText, cancel })
                        }
                    }
                )
                break
            default:
                throw new Error('unsupported ai provider: ' + setting.aiProvider)
        }
    } catch (error) {
        // if a cancellation is performed
        // do not throw an exception
        // otherwise the content will be overwritten.
        if (hasCancel) {
            return fullText
        }
        throw error
    }
    return fullText
}

export async function handleSSE(response: Response, onMessage: (message: string) => void) {
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
    for await (const chunk of iterableStreamAsync(response.body)) {
        const str = new TextDecoder().decode(chunk)
        parser.feed(str)
    }
}

export async function* iterableStreamAsync(stream: ReadableStream): AsyncIterableIterator<Uint8Array> {
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

async function requestOpenAI(
    options: {
        host: string
        apiKey: string
        modelName: string
        maxTokensNumber?: number
        temperature: number
        messages: OpenAIMessage[]
        signal: AbortSignal
    },
    sseHandler: (message: string) => void
) {
    const { host, apiKey, modelName, maxTokensNumber, temperature, messages, signal } = options
    const response = await fetch(`${host}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messages,
            model: modelName,
            max_tokens: maxTokensNumber,
            temperature,
            stream: true,
        }),
        signal: signal,
    }).catch((err) => {
        throw new NetworkError(err.message, host)
    })
    return handleSSE(response, sseHandler)
}

async function requestAzure(
    options: {
        endpoint: string
        deploymentName: string
        apikey: string
        modelName: string
        messages: OpenAIMessage[]
        maxTokensNumber?: number
        temperature: number
        signal: AbortSignal
    },
    sseHandler: (message: string) => void
) {
    let { endpoint, deploymentName, apikey, modelName, messages, maxTokensNumber, temperature, signal } = options
    if (!endpoint.endsWith('/')) {
        endpoint += '/'
    }
    endpoint = endpoint.replace(/^https?:\/\//, '')
    endpoint = 'https://' + endpoint
    const url = `${endpoint}openai/deployments/${deploymentName}/chat/completions?api-version=2023-03-15-preview`
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'api-key': apikey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messages,
            model: modelName,
            max_tokens: maxTokensNumber,
            temperature,
            stream: true,
        }),
        signal: signal,
    }).catch((err) => {
        throw new NetworkError(err.message, endpoint)
    })
    return handleSSE(response, sseHandler)
}

async function requestChatGLM6B(
    options: {
        url: string
        messages: OpenAIMessage[]
        temperature: number
        signal: AbortSignal
    },
    handler: (message: string) => void
) {
    let { url, messages, temperature, signal } = options

    let prompt = ''
    const history: [string, string][] = []
    let userTmp = ''
    let assistantTmp = ''
    for (const msg of messages) {
        switch (msg.role) {
            case 'system':
                history.push([msg.content, '好的，我照做，一切都听你的'])
                prompt = msg.content
                break
            case 'user':
                if (assistantTmp) {
                    history.push([userTmp, assistantTmp])
                    userTmp = ''
                    assistantTmp = ''
                }
                if (userTmp) {
                    userTmp += '\n' + msg.content
                } else {
                    userTmp = msg.content
                }
                prompt = msg.content
                break
            case 'assistant':
                if (assistantTmp) {
                    assistantTmp += '\n' + msg.content
                } else {
                    assistantTmp = msg.content
                }
                break
        }
    }
    if (assistantTmp) {
        history.push([userTmp, assistantTmp])
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt,
            history,
            // temperature,
        }),
    }).catch((err) => {
        throw new NetworkError(err.message, url)
    })
    const json = await res.json()

    if (json.status !== 200) {
        throw new ApiError(JSON.stringify(json))
    }
    const str = typeof json.response === 'string' ? json.response : JSON.stringify(json.response)
    return handler(str)
}

async function requestChatboxAI(
    options: {
        license: string
        instanceId: string
        uuid: string
        // maxTokensNumber: number
        temperature: number
        messages: OpenAIMessage[]
        signal: AbortSignal
    },
    sseHandler: (message: string) => void
) {
    const { license, instanceId, uuid, temperature, messages, signal } = options
    const response = await fetch(`https://chatboxai.app/api/ai/chat`, {
        method: 'POST',
        headers: {
            Authorization: license,
            'Instance-Id': instanceId,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            uuid: uuid,
            messages,
            // max_tokens: maxTokensNumber,
            temperature,
            stream: true,
        }),
        signal: signal,
    }).catch((err) => {
        throw new NetworkError(err.message, 'https://chatboxai.app')
    })
    return handleSSE(response, sseHandler)
}
