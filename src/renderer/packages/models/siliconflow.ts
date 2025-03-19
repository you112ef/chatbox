import { ContextWindowSize } from 'src/shared/constants'
import { ModelMeta } from 'src/shared/types'
import { ModelHelpers } from './base'
import OpenAICompatible from './openai-compatible'

const helpers: ModelHelpers = {
  isModelSupportVision: (model: string) => {
    const notSupportVisionModels = ['deepseek-ai/DeepSeek-R1', 'deepseek-ai/DeepSeek-V3']
    return !notSupportVisionModels.includes(model)
  },
  isModelSupportToolUse: (model: string) => {
    return modelMeta[model]?.functionCalling ?? false
  },
}

interface Options {
  siliconCloudKey: string
  siliconCloudModel: string
  temperature?: number
  topP?: number
}

export default class SiliconFlow extends OpenAICompatible {
  public name = 'SiliconFlow'
  public static helpers = helpers

  constructor(public options: Options) {
    super({
      apiKey: options.siliconCloudKey,
      apiHost: 'https://api.siliconflow.cn/v1',
      model: options.siliconCloudModel,
      temperature: options.temperature,
      topP: options.topP,
    })
  }

  isSupportToolUse() {
    return helpers.isModelSupportToolUse(this.options.siliconCloudModel)
  }
}

// Ref: https://siliconflow.cn/zh-cn/models
const modelMeta: ModelMeta = {
  'deepseek-ai/DeepSeek-R1': { contextWindow: ContextWindowSize.t64k, reasoning: true },
  'deepseek-ai/DeepSeek-V3': { contextWindow: ContextWindowSize.t64k, functionCalling: false }, // model respond with malformed json, so disable it

  'Pro/deepseek-ai/DeepSeek-R1': { contextWindow: ContextWindowSize.t64k, reasoning: true },
  'Pro/deepseek-ai/DeepSeek-V3': { contextWindow: ContextWindowSize.t64k, functionCalling: true },

  'Qwen/Qwen2.5-72B-Instruct': { contextWindow: ContextWindowSize.t32k },
  'Qwen/Qwen2.5-VL-72B-Instruct': { contextWindow: ContextWindowSize.t128k },
  'Qwen/QwQ-32B': { contextWindow: ContextWindowSize.t32k },
}

export const siliconFlowModels = Array.from(Object.keys(modelMeta)).sort()
