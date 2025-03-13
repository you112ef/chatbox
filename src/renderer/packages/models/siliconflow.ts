import { ContextWindowSize } from 'src/shared/constants'
import { ModelMeta } from 'src/shared/types'
import OpenAICompatible from './openai-compatible'
import { ModelHelpers } from './base'

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
    super()
    this.secretKey = options.siliconCloudKey
    this.apiHost = 'https://api.siliconflow.cn/v1'
    this.model = options.siliconCloudModel
    this.temperature = options.temperature
    this.topP = options.topP
  }

  isSupportToolUse() {
    return helpers.isModelSupportToolUse(this.options.siliconCloudModel)
  }

  get webSearchModel() {
    return 'Qwen/Qwen2.5-72B-Instruct'
  }
}

// Ref: https://siliconflow.cn/zh-cn/models
export const modelMeta: ModelMeta = {
  'deepseek-ai/DeepSeek-R1': { contextWindow: ContextWindowSize.t64k, reasoning: true },
  'deepseek-ai/DeepSeek-V3': { contextWindow: ContextWindowSize.t64k, functionCalling: false }, // model respond with malformed json, so disable it
  'deepseek-ai/DeepSeek-R1-Distill-Llama-70B': { contextWindow: ContextWindowSize.t32k, reasoning: true },
  'deepseek-ai/DeepSeek-R1-Distill-Llama-8B': { contextWindow: ContextWindowSize.t32k, reasoning: true },
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B': { contextWindow: ContextWindowSize.t32k, reasoning: true },
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B': { contextWindow: ContextWindowSize.t32k, reasoning: true },
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B': { contextWindow: ContextWindowSize.t32k, reasoning: true },
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B': { contextWindow: ContextWindowSize.t32k, reasoning: true },
  'deepseek-ai/deepseek-vl2': { contextWindow: ContextWindowSize.t32k, vision: true },

  'Pro/deepseek-ai/DeepSeek-R1': { contextWindow: ContextWindowSize.t64k, reasoning: true },
  'Pro/deepseek-ai/DeepSeek-V3': { contextWindow: ContextWindowSize.t64k, functionCalling: true },
  'Pro/deepseek-ai/DeepSeek-R1-Distill-Llama-8B': { contextWindow: ContextWindowSize.t32k, reasoning: true },
  'Pro/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B': { contextWindow: ContextWindowSize.t32k, reasoning: true },
  'Pro/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B': { contextWindow: ContextWindowSize.t32k, reasoning: true },

  'Qwen/Qwen2.5-7B-Instruct': { contextWindow: ContextWindowSize.t32k, functionCalling: true },
  'Qwen/Qwen2.5-14B-Instruct': { contextWindow: ContextWindowSize.t32k, functionCalling: true },
  'Qwen/Qwen2.5-32B-Instruct': { contextWindow: ContextWindowSize.t32k, functionCalling: true },
  'Qwen/Qwen2.5-72B-Instruct': { contextWindow: ContextWindowSize.t32k, functionCalling: true },
  'Qwen/Qwen2.5-72B-Instruct-128K': { contextWindow: 131_072, functionCalling: true },
  'Qwen/Qwen2-7B-Instruct': { contextWindow: ContextWindowSize.t32k },
  'Qwen/Qwen2-1.5B-Instruct': { contextWindow: ContextWindowSize.t32k },
  'Qwen/Qwen2-VL-72B-Instruct': { contextWindow: ContextWindowSize.t32k, vision: true },

  'THUDM/glm-4-9b-chat': { contextWindow: ContextWindowSize.t32k, functionCalling: true },
  'THUDM/chatglm3-6b': { contextWindow: ContextWindowSize.t32k },

  '01-ai/Yi-1.5-34B-Chat-16K': { contextWindow: ContextWindowSize.t16k },
  '01-ai/Yi-1.5-9B-Chat-16K': { contextWindow: ContextWindowSize.t16k },
  '01-ai/Yi-1.5-6B-Chat': { contextWindow: 4096 },

  'internlm/internlm2_5-7b-chat': { contextWindow: ContextWindowSize.t32k, functionCalling: true },
  'internlm/internlm2_5-20b-chat': { contextWindow: ContextWindowSize.t32k, functionCalling: true },

  'google/gemma-2-9b-it': { contextWindow: 8192 },
  'google/gemma-2-27b-it': { contextWindow: 8192 },

  'meta-llama/Meta-Llama-3.3-70B-Instruct': { contextWindow: ContextWindowSize.t32k, functionCalling: true },
  'meta-llama/Meta-Llama-3.1-8B-Instruct': { contextWindow: ContextWindowSize.t32k, functionCalling: true },
  'meta-llama/Meta-Llama-3.1-70B-Instruct': { contextWindow: ContextWindowSize.t32k, functionCalling: true },
  'meta-llama/Meta-Llama-3.1-405B-Instruct': { contextWindow: ContextWindowSize.t32k },
}

export const siliconFlowModels = Array.from(Object.keys(modelMeta)).sort()
