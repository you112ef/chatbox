import StandardOpenAI from './standard_openai'

interface Options {
  lmStudioHost: string
  lmStudioModel: string
  temperature?: number
  topP?: number
}

export default class LMStudio extends StandardOpenAI {
  public name = 'LM Studio'

  public options: Options
  constructor(options: Options) {
    super()
    this.options = options

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

  isSupportVision(model: string): boolean {
    model = model.toLowerCase()
    return model.includes('vision') || model.includes('llava')
  }

  isSupportToolUse(): boolean {
    return false
  }
}
