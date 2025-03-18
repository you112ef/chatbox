import type { ModelHelpers } from './base'
import OpenAICompatible from './openai-compatible'

const helpers: ModelHelpers = {
  isModelSupportVision: (model: string) => {
    return false
  },
  isModelSupportToolUse: (model: string) => {
    return false
  },
}

interface Options {
  ollamaHost: string
  ollamaModel: string
  temperature: number
}

export default class Ollama extends OpenAICompatible {
  public name = 'Ollama'
  public static helpers = helpers

  constructor(public options: Options) {
    super({
      apiKey: 'ollama',
      apiHost: normalizeApiHost(options.ollamaHost),
      model: options.ollamaModel,
      temperature: options.temperature,
    })
  }

  isSupportToolUse(): boolean {
    return helpers.isModelSupportToolUse(this.options.ollamaModel)
  }
}

function normalizeApiHost(apiHost: string) {
  let host = apiHost.trim()
  if (host.endsWith('/')) {
    host = host.slice(0, -1)
  }
  if (!host.startsWith('http')) {
    host = 'http://' + host
  }
  if (host === 'http://localhost:11434') {
    host = 'http://127.0.0.1:11434' // 让其在浏览器中也能访问
  }
  if (!host.endsWith('/v1')) {
    host += '/v1'
  }
  return host
}
