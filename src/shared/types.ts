import { v4 as uuidv4 } from 'uuid'
import { Model } from '../renderer/config'

export type Message = OpenAIMessage & {
    id: string
    cancel?: () => void
    generating?: boolean
    aiProvider?: ModelProvider
    model?: string

    error?: string
    errorExtra?: {
        [key: string]: any
    }

    wordCount?: number // 当前消息的字数
    tokenCount?: number // 当前消息的 token 数量
    tokensUsed?: number // 生成当前消息的 token 使用量
}

export interface Session {
    id: string
    name: string
    picUrl?: string
    messages: Message[]
    starred?: boolean
    copilotId?: string
    settings?: ModelSettings
}

export function createMessage(role: OpenAIRoleEnumType = OpenAIRoleEnum.User, content: string = ''): Message {
    return {
        id: uuidv4(),
        content: content,
        role: role,
    }
}

export enum ModelProvider {
    ChatboxAI = 'chatbox-ai',
    OpenAI = 'openai',
    Azure = 'azure',
    ChatGLM6B = 'chatglm-6b',
}

export interface ModelSettings {
    aiProvider: ModelProvider

    // openai
    openaiKey: string
    apiHost: string
    model: Model

    // azure
    azureEndpoint: string
    azureDeploymentName: string
    azureApikey: string

    // chatglm-6b
    chatglm6bUrl: string

    // chatbox-ai
    licenseKey?: string
    licenseInstances?: {
        [key: string]: string
    }

    temperature: number
    openaiMaxTokens: number // 生成消息的最大限制，是传入 OpenAI 接口的参数
    openaiMaxContextTokens: number // 聊天消息上下文的tokens限制
    // maxContextSize: string 弃用，字段名永远不在使用，避免老版本报错
    // maxTokens: string 弃用，字段名永远不在使用，避免老版本报错
}

export interface Settings extends ModelSettings {
    showWordCount?: boolean
    showTokenCount?: boolean
    showTokenUsed?: boolean
    showModelName?: boolean

    theme: ThemeMode
    language: Language
    languageInited?: boolean
    fontSize: number

    disableQuickToggleShortcut?: boolean    // 是否关闭快捷键切换窗口显隐

    defaultPrompt?: string // 新会话的默认 prompt
}

export type Language = 'en' | 'zh-Hans' | 'zh-Hant'

export function getMsgDisplayModelName(settings: ModelSettings) {
    switch (settings.aiProvider) {
        case ModelProvider.OpenAI:
            return settings.model
        case ModelProvider.Azure:
            return `Azure OpenAI (${settings.azureDeploymentName})`
        case ModelProvider.ChatGLM6B:
            return 'ChatGLM-6B'
        case ModelProvider.ChatboxAI:
            return 'Chatbox-AI'
        default:
            return 'unknown'
    }
}

export const OpenAIRoleEnum = {
    System: 'system',
    User: 'user',
    Assistant: 'assistant',
} as const

export type OpenAIRoleEnumType = (typeof OpenAIRoleEnum)[keyof typeof OpenAIRoleEnum]

// OpenAIMessage OpenAI API 消息类型。（对于业务追加的字段，应该放到 Message 中）
export interface OpenAIMessage {
    role: OpenAIRoleEnumType
    content: string
    name?: string
}

export interface Config {
    uuid: string
}

export interface SponsorAd {
    text: string
    url: string
}

export interface SponsorAboutBanner {
    type: 'picture' | 'picture-text'
    name: string
    pictureUrl: string
    link: string
    title: string
    description: string
}

export interface CopilotDetail {
    id: string
    name: string
    picUrl?: string
    prompt: string
    demoQuestion?: string
    demoAnswer?: string
    starred?: boolean
    usedCount: number
    shared?: boolean
}

export interface Toast {
    id: string
    content: string
}

export enum ThemeMode {
    Dark,
    Light,
    System,
}

export interface RemoteConfig {
    setting_chatboxai_first: boolean
    product_ids: number[]
}
