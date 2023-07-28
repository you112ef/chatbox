import { Language, ModelProvider } from '../shared/types'

// Ref: https://platform.openai.com/docs/models/gpt-4
export const modelConfigs = {
    'gpt-3.5-turbo': {
        maxTokens: 4096, // 模型支持最大的token数
    },
    'gpt-3.5-turbo-0613': {
        maxTokens: 4096,
    },
    'gpt-3.5-turbo-16k': {
        maxTokens: 16384,
    },
    'gpt-3.5-turbo-16k-0613': {
        maxTokens: 16384,
    },
    'gpt-4': {
        maxTokens: 8192,
    },
    'gpt-4-0613': {
        maxTokens: 8192,
    },
    'gpt-4-32k': {
        maxTokens: 32768,
    },
    'gpt-4-32k-0613': {
        maxTokens: 32768,
    },
}
export type Model = keyof typeof modelConfigs
export const models = Array.from(Object.keys(modelConfigs)) as Model[]

export const languageNameMap = {
    en: 'English',
    'zh-Hans': '简体中文',
    'zh-Hant': '繁體中文',
}
export const languages = Array.from(Object.keys(languageNameMap)) as Language[]

export const aiProviderNameHash = {
    [ModelProvider.OpenAI]: 'OpenAI API',
    [ModelProvider.Azure]: 'Azure OpenAI API',
    [ModelProvider.ChatGLM6B]: 'ChatGLM-6B',
    [ModelProvider.ChatboxAI]: 'Chatbox-AI',
}

export const aiModelProviderList = [
    {
        value: ModelProvider.ChatboxAI,
        label: aiProviderNameHash[ModelProvider.ChatboxAI],
        featured: true,
    },
    {
        value: ModelProvider.OpenAI,
        label: aiProviderNameHash[ModelProvider.OpenAI],
    },
    {
        value: ModelProvider.Azure,
        label: aiProviderNameHash[ModelProvider.Azure],
    },
    {
        value: ModelProvider.ChatGLM6B,
        label: aiProviderNameHash[ModelProvider.ChatGLM6B],
    },
    {
        value: 'claude',
        label: 'Claude API',
        disabled: true,
    },
    {
        value: 'hunyuan',
        label: '腾讯混元',
        disabled: true,
    },
]
