import { Language, ModelProvider, ChatboxAIModel } from '../shared/types'

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

    // 以下模型延长到了 2024 年 6 月
    // https://platform.openai.com/docs/models/continuous-model-upgrades
    'gpt-3.5-turbo-0301': {
        maxTokens: 4096,
    },
    'gpt-4-0314': {
        maxTokens: 8192,
    },
    'gpt-4-32k-0314': {
        maxTokens: 8192,
    },
}
export type Model = keyof typeof modelConfigs
export const models = Array.from(Object.keys(modelConfigs)).sort() as Model[]

export type ClaudeModel = 'claude-instant-1' | 'claude-1' | 'claude-instant-1-100k' | 'claude-1-100k' | 'claude-2'

export const claudeModels: ClaudeModel[] = [
    'claude-instant-1',
    'claude-1',
    'claude-instant-1-100k',
    'claude-1-100k',
    'claude-2',
]

export const chatboxAIModels: ChatboxAIModel[] = ['chatboxai-3.5', 'chatboxai-4']

export const languageNameMap = {
    en: 'English',
    'zh-Hans': '简体中文',
    'zh-Hant': '繁體中文',
    ja: '日本語',
    ko: '한국어',
    ru: 'Русский', // Russian
    de: 'Deutsch', // German
    fr: 'Français', // French
}
export const languages = Array.from(Object.keys(languageNameMap)) as Language[]

export const aiProviderNameHash = {
    [ModelProvider.OpenAI]: 'OpenAI API',
    [ModelProvider.Azure]: 'Azure OpenAI API',
    [ModelProvider.ChatGLM6B]: 'ChatGLM-6B',
    [ModelProvider.ChatboxAI]: 'Chatbox-AI',
    [ModelProvider.Claude]: 'Claude',
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
        value: ModelProvider.Claude,
        label: aiProviderNameHash[ModelProvider.Claude],
    },
    {
        value: 'hunyuan',
        label: '腾讯混元',
        disabled: true,
    },
]
