import platform from '@/platform'
import StandardOpenAI from './standard_openai'
import { ApiError } from './errors'
import { onResultChange } from './base'

// https://api-docs.deepseek.com/zh-cn/quick_start/pricing
export const modelConfig = {
    'deepseek-chat': {
        contextWindow: 64_000,
        maxTokens: 8_000,
        vision: false,
    },
    'deepseek-coder': {
        contextWindow: 64_000,
        maxTokens: 8_000,
        vision: false,
    },
    'deepseek-reasoner': {
        contextWindow: 64_000,
        maxTokens: 8_000,
        vision: false,
    }
}

export const deepSeekModels = Object.keys(modelConfig)

interface Options {
    deepseekAPIKey: string
    deepseekModel: string
    temperature?: number
    topP?: number
}

export default class DeepSeek extends StandardOpenAI {
    public name = 'DeepSeek'

    public useProxy = platform.type !== 'desktop'

    public options: Options
    constructor(options: Options) {
        super()
        this.options = options
        this.secretKey = options.deepseekAPIKey
        this.apiHost = 'https://api.deepseek.com/v1'
        this.model = options.deepseekModel
        this.temperature = options.temperature
        this.topP = options.topP
        if (this.model === 'deepseek-reasoner') {
            this.temperature = undefined
            this.topP = undefined
        }
    }

    isSupportVision(model: string): boolean {
        return false // 看样子 deepseek 虽然不支持图片输入，但是自动兼容了图片输入接口
    }

    listLocalModels(): string[] {
        return deepSeekModels
    }
 
}
