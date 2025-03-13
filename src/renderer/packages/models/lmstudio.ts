import { ModelHelpers } from './base'
import OpenAICompatible from './openai-compatible'

const helpers: ModelHelpers = {
  isModelSupportVision: (model: string) => {
    model = model.toLowerCase()
    return model.includes('vision') || model.includes('llava')
  },
  isModelSupportToolUse: (model: string) => {
    return false
  },
}

interface Options {
  lmStudioHost: string
  lmStudioModel: string
  temperature?: number
  topP?: number
}

export default class LMStudio extends OpenAICompatible {
  public name = 'LM Studio'
  public static helpers = helpers

  constructor(public options: Options) {
    super()
    this.apiHost = options.lmStudioHost
    if (this.apiHost) {
      this.apiHost = this.apiHost.trim()
    }
    if (!this.apiHost.startsWith('http')) {
      this.apiHost = 'http://' + this.apiHost
    }
    if (this.apiHost.endsWith('/')) {
      this.apiHost = this.apiHost.slice(0, -1)
    }
    if (!this.apiHost.endsWith('/v1')) {
      this.apiHost += '/v1'
    }

    this.model = options.lmStudioModel
    this.temperature = options.temperature
    this.topP = options.topP
  }

  isSupportToolUse() {
    return helpers.isModelSupportToolUse(this.options.lmStudioModel)
  }
}
