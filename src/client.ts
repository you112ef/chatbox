import { Message, OpenAIMessage, Settings } from './types';
import * as wordCount from './utils';
import { createParser } from 'eventsource-parser'

export interface OnTextCallbackResult {
    // response content
    text: string;
    // cancel for fetch
    cancel: () => void;
}

export async function replay(
    setting: Settings,
    msgs: Message[],
    onText?: (option: OnTextCallbackResult) => void,
    onError?: (error: Error) => void,
) {
    if (msgs.length === 0) {
        throw new Error('No messages to replay')
    }
    const head = msgs[0].role === 'system' ? msgs[0] : undefined
    if (head) {
        msgs = msgs.slice(1)
    }

    const maxTokensNumber = Number(setting.maxTokens)
    const maxLen = Number(setting.maxContextSize)
    let totalLen = head ? wordCount.estimateTokens(head.content) : 0

    let prompts: Message[] = []
    for (let i = msgs.length - 1; i >= 0; i--) {
        const msg = msgs[i]
        const msgTokenSize: number = wordCount.estimateTokens(msg.content) + 200 // 200 作为预估的误差补偿
        if (msgTokenSize + totalLen > maxLen) {
            break
        }
        prompts = [msg, ...prompts]
        totalLen += msgTokenSize
    }
    if (head) {
        prompts = [head, ...prompts]
    }

    // fetch has been canceled
    let hasCancel = false;
    // abort signal for fetch
    const controller = new AbortController();
    const cancel = () => {
        hasCancel = true;
        controller.abort();
    };

    let fullText = '';
    try {
        const messages: OpenAIMessage[] = prompts.map(msg => ({ role: msg.role, content: msg.content }))
        let response: Response | null = null
        switch (setting.aiProvider) {
            case 'openai':
                response = await requestOpenAI({
                    host: setting.apiHost,
                    apiKey: setting.openaiKey,
                    modelName: setting.model,
                    maxTokensNumber: maxTokensNumber,
                    temperature: setting.temperature,
                    messages,
                    signal: controller.signal,
                })
                break;
            case 'azure':
                response = await requestAzure({
                    endpoint: setting.azureEndpoint,
                    deploymentName: setting.azureDeploymentName,
                    apikey: setting.azureApikey,
                    modelName: setting.model,
                    messages,
                    maxTokensNumber,
                    signal: controller.signal,
                })
                break;
            default:
                break;
        }
        if (!response) {
            throw new Error('unsupported ai provider: ' + setting.aiProvider)
        }
        await handleSSE(response, (message) => {
            if (message === '[DONE]') {
                return;
            }
            const data = JSON.parse(message)
            if (data.error) {
                throw new Error(`Error from OpenAI: ${JSON.stringify(data)}`)
            }
            const text = data.choices[0]?.delta?.content
            if (text !== undefined) {
                fullText += text
                if (onText) {
                    onText({ text: fullText, cancel })
                }
            }
        })
    } catch (error) {
        // if a cancellation is performed
        // do not throw an exception
        // otherwise the content will be overwritten.
        if (hasCancel) {
            return;
        }
        if (onError) {
            onError(error as any)
        }
        throw error
    }
    return fullText
}

export async function handleSSE(response: Response, onMessage: (message: string) => void) {
    if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error ? JSON.stringify(error) : `${response.status} ${response.statusText}`)
    }
    if (response.status !== 200) {
        throw new Error(`Error from OpenAI: ${response.status} ${response.statusText}`)
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
    const reader = stream.getReader();
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

async function requestOpenAI(options: {
    host: string
    apiKey: string
    modelName: string
    maxTokensNumber: number
    temperature: number
    messages: OpenAIMessage[]
    signal: AbortSignal
}) {
    const { host, apiKey, modelName, maxTokensNumber, temperature, messages, signal } = options
    const response = await fetch(`${host}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
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
    })
    return response
}

async function requestAzure(options: {
    endpoint: string,
    deploymentName: string,
    apikey: string,
    modelName: string
    messages: OpenAIMessage[],
    maxTokensNumber: number
    signal: AbortSignal,
}) {
    let { endpoint, deploymentName, apikey, modelName, messages, maxTokensNumber, signal } = options
    if (!endpoint.endsWith('/')) {
        endpoint += '/'
    }
    if (!endpoint.startsWith('https://')) {
        endpoint = 'https://' + endpoint
    }
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
            temperature: 0.7,
            stream: true
        }),
        signal: signal,
    });
    return response
}
