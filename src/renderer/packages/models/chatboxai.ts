import { ChatboxAILicenseDetail, ChatboxAIModel } from 'src/shared/types'
import Base from './base'
import { API_ORIGIN } from '../remote'

interface Options {
    licenseKey?: string
    chatboxAIModel?: ChatboxAIModel
    licenseInstances?: {
        [key: string]: string
    }
    licenseDetail?: ChatboxAILicenseDetail
    language: string
    dalleStyle: 'vivid' | 'natural'
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

    async paint(prompt: string, num: number, signal?: AbortSignal): Promise<string[]> {
        const concurrence: Promise<string>[] = []
        for (let i = 0; i < num; i++) {
            concurrence.push(this.callPaint(prompt, signal))
        }
        return await Promise.all(concurrence)
    }

    async callPaint(prompt: string, signal?: AbortSignal): Promise<string> {
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
