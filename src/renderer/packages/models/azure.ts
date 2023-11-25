import Base from './base'

interface Options {
    azureEndpoint: string
    azureDeploymentName: string
    azureDalleDeploymentName: string // dall-e-3 的部署名称
    azureApikey: string

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

    async paint(prompt: string, num: number, signal?: AbortSignal): Promise<string[]> {
        const concurrence: Promise<string>[] = []
        for (let i = 0; i < num; i++) {
            concurrence.push(this.callDallE3(prompt, signal))
        }
        return await Promise.all(concurrence)
    }

    async callDallE3(prompt: string, signal?: AbortSignal): Promise<string> {
        const origin = new URL((this.options.azureEndpoint || '').trim()).origin
        const url = `${origin}/openai/deployments/${this.options.azureDalleDeploymentName}/images/generations?api-version=2023-12-01-preview`
        const headers = {
            'api-key': this.options.azureApikey,
            'Content-Type': 'application/json',
        }
        const res = await this.post(
            url,
            headers,
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
}
