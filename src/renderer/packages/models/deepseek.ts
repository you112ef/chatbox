import platform from '@/platform'
import OpenAICompatible from './openai-compatible'
import { ModelHelpers } from './base'

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
  },
}

export const deepSeekModels = Object.keys(modelConfig)

const helpers: ModelHelpers = {
  isModelSupportVision: (model: string) => {
    return false
  },
  isModelSupportToolUse: (model: string) => {
    return false
  },
}

interface Options {
  deepseekAPIKey: string
  deepseekModel: string
  temperature?: number
  topP?: number
}

export default class DeepSeek extends OpenAICompatible {
  public name = 'DeepSeek'
  public useProxy = platform.type !== 'desktop'
  public static helpers = helpers

  constructor(public options: Options) {
    super()
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

  listLocalModels(): string[] {
    return deepSeekModels
  }

  isSupportToolUse() {
    return helpers.isModelSupportToolUse(this.options.deepseekModel)
  }

  protected get webSearchModel(): string {
    return 'deepseek-chat'
  }
}
