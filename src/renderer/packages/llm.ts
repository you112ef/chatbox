import { Config, Message, ModelProvider, OpenAIMessage, Settings, ChatboxAIModel } from '../../shared/types'
import { createParser } from 'eventsource-parser'
import { ApiError, NetworkError, BaseError, QuotaExhausted } from './models/errors'
import { API_ORIGIN } from './remote'

export interface OnTextCallbackResult {
    // response content
    text: string
    // cancel for fetch
    cancel: () => void
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
                const model: ChatboxAIModel = setting.chatboxAIModel || 'chatboxai-3.5'
                await requestChatboxAI(
                    {
                        license: license,
                        instanceId: instanceId,
                        uuid: config.uuid,
                        // maxTokensNumber: maxTokensNumber,
                        model,
                        temperature: setting.temperature,
                        messages,
                        language: setting.language,
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
                        modelName: setting.model === 'custom-model' ? setting.openaiCustomModel || '' : setting.model,
                        maxTokensNumber: setting.openaiMaxTokens === 0 ? undefined : setting.openaiMaxTokens,
                        temperature: setting.temperature,
                        topP: setting.topP,
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
                        messages,
                        maxTokensNumber: setting.openaiMaxTokens === 0 ? undefined : setting.openaiMaxTokens,
                        temperature: setting.temperature,
                        topP: setting.topP,
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
            case ModelProvider.Claude:
                await requestClaude(
                    {
                        claudeApiKey: setting.claudeApiKey,
                        claudeModel: setting.claudeModel,
                        temperature: setting.temperature,
                        messages,
                        signal: controller.signal,
                    },
                    (message) => {
                        const data = JSON.parse(message)
                        if (data.error) {
                            throw new ApiError(`Error from Claude: ${JSON.stringify(data)}`)
                        }
                        let text: string = data.completion
                        if (text !== undefined) {
                            fullText += text
                            if (onText) {
                                onText({ text: fullText.trimStart(), cancel })
                            }
                        }
                    }
                )
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
        topP: number
        messages: OpenAIMessage[]
        signal: AbortSignal
    },
    sseHandler: (message: string) => void
) {
    const { host, apiKey, modelName, maxTokensNumber, temperature, topP, messages, signal } = options
    const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    }
    if (host.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = 'https://localhost:3000/' // 支持 OpenRouter，需要设置这个表头才能正常工作
    }
    const response = await post(
        `${host}/v1/chat/completions`,
        headers,
        {
            messages,
            model: modelName,
            max_tokens: maxTokensNumber,
            temperature,
            top_p: topP,
            stream: true,
        },
        signal
    )
    return handleSSE(response, sseHandler)
}

async function requestAzure(
    options: {
        endpoint: string
        deploymentName: string
        apikey: string
        messages: OpenAIMessage[]
        maxTokensNumber?: number
        temperature: number
        topP: number
        signal: AbortSignal
    },
    sseHandler: (message: string) => void
) {
    const { endpoint, deploymentName, apikey, messages, maxTokensNumber, temperature, topP, signal } = options
    const origin = new URL((endpoint || '').trim()).origin
    const url = `${origin}/openai/deployments/${deploymentName}/chat/completions?api-version=2023-03-15-preview`
    const response = await post(
        url,
        {
            'api-key': apikey,
            'Content-Type': 'application/json',
        },
        {
            messages,
            model: deploymentName,
            max_tokens: maxTokensNumber,
            temperature,
            top_p: topP,
            stream: true,
        },
        signal
    )
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

    const res = await post(
        url,
        {
            'Content-Type': 'application/json',
        },
        {
            prompt,
            history,
            // temperature,
        }
    )
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
        model: ChatboxAIModel
        // maxTokensNumber: number
        temperature: number
        messages: OpenAIMessage[]
        language: string
        signal: AbortSignal
    },
    sseHandler: (message: string) => void
) {
    const { license, instanceId, uuid, model, temperature, messages, signal, language } = options
    const response = await post(
        `${API_ORIGIN}/api/ai/chat`,
        {
            Authorization: license,
            'Instance-Id': instanceId,
            'Content-Type': 'application/json',
        },
        {
            uuid: uuid,
            model,
            messages,
            // max_tokens: maxTokensNumber,
            temperature,
            language,
            stream: true,
        },
        signal
    )
    return handleSSE(response, sseHandler)
}

async function requestClaude(
    options: {
        claudeApiKey: string
        claudeModel: string
        temperature: number
        messages: OpenAIMessage[]
        signal: AbortSignal
    },
    sseHandler: (message: string) => void
) {
    // "\n\nHuman: Hello, world!\n\nAssistant:"
    let prompt = options.messages
        .map((m) => (m.role !== 'assistant' ? `Human: ${m.content}` : `Assistant: ${m.content}`))
        .join('\n\n')
    prompt += '\n\nAssistant:'
    const response = await post(
        'https://api.anthropic.com/v1/complete',
        {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
            'x-api-key': options.claudeApiKey,
        },
        {
            model: options.claudeModel,
            prompt: prompt,
            max_tokens_to_sample: 100_000,
            stream: true,
        },
        options.signal
    )
    return handleSSE(response, sseHandler)
}

async function post(
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
            // 配额用完了
            if (res.status === 499) {
                const json = await res.json()
                if (json?.error?.code === 'token_quota_exhausted') {
                    throw new QuotaExhausted()
                }
            }
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
