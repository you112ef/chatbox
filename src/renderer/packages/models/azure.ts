import { Message } from 'src/shared/types'
import Base from './base'
import { ApiError } from './errors'
import { onResultChange } from './interfaces'
import { openaiModelConfigs, populateOpenAIMessage } from './openai'

interface Options {
    azureEndpoint: string
    azureDeploymentName: string
    azureDalleDeploymentName: string // dall-e-3 的部署名称
    azureApikey: string

    // openaiMaxTokens: number
    temperature: number
    topP: number

    dalleStyle: 'vivid' | 'natural'
    imageGenerateNum: number // 生成图片的数量
}

export default class AzureOpenAI extends Base {
    public name = 'Azure OpenAI'

    public options: Options
    constructor(options: Options) {
        super()
        this.options = options
    }

    getApiVersion() {
        const apiVersion = '2023-12-01-preview'
        return apiVersion
    }

    async callChatCompletion(rawMessages: Message[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        const messages = await populateOpenAIMessage(rawMessages, this.options.azureDeploymentName as any)

        // 解决 GPT-4 不认识自己的问题
        for (const message of messages) {
            if (message.role === 'system') {
                message.content = `Current model: ${this.options.azureDeploymentName}\n\n` + message.content
                break
            }
        }

        const origin = new URL((this.options.azureEndpoint || '').trim()).origin
        const apiVersion = this.getApiVersion()
        const url = `${origin}/openai/deployments/${this.options.azureDeploymentName}/chat/completions?api-version=${apiVersion}`
        const response = await this.post(
            url,
            this.getHeaders(),
            {
                messages,
                model: this.options.azureDeploymentName,
                // vision 模型的默认 max_tokens 极低，基本很难回答完整，因此手动设置为模型最大值
                max_tokens: this.options.azureDalleDeploymentName.toLowerCase() === 'gpt-4-vision-preview'
                    ? openaiModelConfigs['gpt-4-vision-preview'].maxTokens
                    : undefined,
                temperature: this.options.temperature,
                top_p: this.options.topP,
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
                throw new ApiError(`Error from Azure OpenAI: ${JSON.stringify(data)}`)
            }
            const text = data.choices[0]?.delta?.content
            if (text !== undefined) {
                result += text
                if (onResultChange) {
                    onResultChange(result)
                }
            }
        })
        return result
    }

    async callImageGeneration(prompt: string, signal?: AbortSignal): Promise<string> {
        const origin = new URL((this.options.azureEndpoint || '').trim()).origin
        const apiVersion = this.getApiVersion()
        const url = `${origin}/openai/deployments/${this.options.azureDalleDeploymentName}/images/generations?api-version=${apiVersion}`
        const res = await this.post(
            url,
            this.getHeaders(),
            {
                prompt,
                response_format: 'b64_json',
                model: 'dall-e-3',
                style: this.options.dalleStyle,
            },
            signal
        )
        const json = await res.json()
        return json['data'][0]['b64_json']
    }

    getHeaders() {
        return {
            'api-key': this.options.azureApikey,
            'Content-Type': 'application/json',
        }
    }
}
