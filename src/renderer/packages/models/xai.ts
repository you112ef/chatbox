import platform from '@/platform'
import OpenAICompatible from './openai-compatible'

interface Options {
  xAIKey: string
  xAIModel: string
  temperature?: number
  topP?: number
}

export default class XAI extends OpenAICompatible {
  public name = 'xAI'

  public useProxy = platform.type !== 'desktop'

  public options: Options
  constructor(options: Options) {
    super()
    this.options = options
    this.secretKey = options.xAIKey
    this.apiHost = 'https://api.x.ai/v1'
    this.model = options.xAIModel
    this.temperature = options.temperature
    this.topP = options.topP
  }

  isSupportVision(model: string): boolean {
    return true
  }

  listLocalModels(): string[] {
    return ['grok-beta']
  }

  async listRemoteModels(): Promise<string[]> {
    return [] // 暂时无法得知是否提供接口
  }

  isSupportToolUse(): boolean {
    return false
  }
}
