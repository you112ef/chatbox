import platform from '@/platform'
import OpenAICompatible from './openai-compatible'
import { ModelHelpers } from './base'

const helpers: ModelHelpers = {
  isModelSupportVision: (model: string) => {
    return false
  },
  isModelSupportToolUse: (model: string) => {
    return false
  },
}

interface Options {
  xAIKey: string
  xAIModel: string
  temperature?: number
  topP?: number
}

export default class XAI extends OpenAICompatible {
  public name = 'xAI'
  public useProxy = platform.type !== 'desktop'
  public static helpers = helpers

  constructor(public options: Options) {
    super()
    this.secretKey = options.xAIKey
    this.apiHost = 'https://api.x.ai/v1'
    this.model = options.xAIModel
    this.temperature = options.temperature
    this.topP = options.topP
  }

  isSupportToolUse() {
    return helpers.isModelSupportToolUse(this.options.xAIModel)
  }

  listLocalModels(): string[] {
    return ['grok-beta']
  }

  async listRemoteModels(): Promise<string[]> {
    return [] // 暂时无法得知是否提供接口
  }
}
