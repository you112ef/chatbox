import { v4 as uuidv4 } from 'uuid'
import { Model } from './config'

export type Message = OpenAIMessage & {
    id: string
    cancel?: () => void
    generating?: boolean
    model?: string
}

export interface Session {
    id: string
    name: string
    picUrl?: string
    messages: Message[]
    starred?: boolean
    copilotId?: string
}

export function createMessage(role: OpenAIRoleEnumType = OpenAIRoleEnum.User, content: string = ''): Message {
    return {
        id: uuidv4(),
        content: content,
        role: role,
    }
}

export function getEmptySession(name: string = 'Untitled'): Session {
    return {
        id: uuidv4(),
        name: name,
        messages: [
            {
                id: uuidv4(),
                role: 'system',
                content:
                    'You are a helpful assistant. You can help me by answering my questions. You can also ask me questions.',
            },
        ],
    }
}

export enum ModelProvider {
    ChatboxAI = 'chatbox-ai',
    OpenAI = 'openai',
    Azure = 'azure',
    ChatGLM6B = 'chatglm-6b',
}

export interface Settings {
    aiProvider: ModelProvider

    // openai
    openaiKey: string
    apiHost: string

    // azure
    azureEndpoint: string
    azureDeploymentName: string
    azureApikey: string

    // chatglm-6b
    chatglm6bUrl: string

    model: Model
    temperature: number
    openaiMaxTokens: number // 生成消息的最大限制，是传入 OpenAI 接口的参数
    openaiMaxContextTokens: number // 聊天消息上下文的tokens限制
    // maxContextSize: string 弃用，字段名永远不在使用，避免老版本报错
    // maxTokens: string 弃用，字段名永远不在使用，避免老版本报错

    showWordCount?: boolean
    showTokenCount?: boolean
    showModelName?: boolean

    theme: ThemeMode
    language: string
    fontSize: number

    licenseKey?: string
    licenseInstances?: {
        [key: string]: string
    }
}

export function getMsgDisplayModelName(settings: Settings) {
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
