import StandardOpenAI from './standard_openai'

interface Options {
    siliconCloudKey: string
    siliconCloudModel: string
    temperature?: number
    topP?: number
}

export default class SiliconFlow extends StandardOpenAI {
    public name = 'SiliconFlow'

    public options: Options
    constructor(options: Options) {
        super()
        this.options = options
        this.secretKey = options.siliconCloudKey
        this.apiHost = 'https://api.siliconflow.cn/v1'
        this.model = options.siliconCloudModel
        this.temperature = options.temperature
        this.topP = options.topP
    }

    isSupportVision(model: string): boolean {
        return true // 有些支持，有些不支持。不支持的会报错。
    }

}

// Ref: https://siliconflow.cn/zh-cn/models
export const siliconflowModelConfigs = {
    'deepseek-ai/DeepSeek-R1': { maxTokens: 32768 },
    'deepseek-ai/DeepSeek-V3': { maxTokens: 32768 },
    'Qwen/Qwen2-72B-Instruct': { maxTokens: 32768 },
    'Qwen/Qwen2-Math-72B-Instruct': { maxTokens: 32768 },
    'Qwen/Qwen2-57B-A14B-Instruct': { maxTokens: 32768 },
    'Qwen/Qwen2-7B-Instruct': { maxTokens: 32768 },
    'Qwen/Qwen2-1.5B-Instruct': { maxTokens: 32768 },
    'Qwen/Qwen1.5-110B-Chat': { maxTokens: 32768 },
    'Qwen/Qwen1.5-32B-Chat': { maxTokens: 32768 },
    'Qwen/Qwen1.5-14B-Chat': { maxTokens: 32768 },
    'Qwen/Qwen1.5-7B-Chat': { maxTokens: 32768 },
    'deepseek-ai/DeepSeek-Coder-V2-Instruct': { maxTokens: 32768 },
    'deepseek-ai/DeepSeek-V2-Chat': { maxTokens: 32768 },
    'deepseek-ai/deepseek-llm-67b-chat': { maxTokens: 32768 },
    'THUDM/glm-4-9b-chat': { maxTokens: 32768 },
    'THUDM/chatglm3-6b': { maxTokens: 32768 },
    '01-ai/Yi-1.5-34B-Chat-16K': { maxTokens: 16384 },
    '01-ai/Yi-1.5-9B-Chat-16K': { maxTokens: 16384 },
    '01-ai/Yi-1.5-6B-Chat': { maxTokens: 4096 },
    'internlm/internlm2_5-7b-chat': { maxTokens: 32768 },
    'google/gemma-2-9b-it': { maxTokens: 8192 },
    'google/gemma-2-27b-it': { maxTokens: 8192 },
    'internlm/internlm2_5-20b-chat': { maxTokens: 32768 },
    'meta-llama/Meta-Llama-3.1-8B-Instruct': { maxTokens: 32768 },
    'meta-llama/Meta-Llama-3.1-70B-Instruct': { maxTokens: 32768 },
    'meta-llama/Meta-Llama-3.1-405B-Instruct': { maxTokens: 32768 },
    'meta-llama/Meta-Llama-3-70B-Instruct': { maxTokens: 8192 },
    'mistralai/Mistral-7B-Instruct-v0.2': { maxTokens: 32768 },
    'mistralai/Mixtral-8x7B-Instruct-v0.1': { maxTokens: 32768 },
}

export const siliconFlowModels = Array.from(Object.keys(siliconflowModelConfigs)).sort()
