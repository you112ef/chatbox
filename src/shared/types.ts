import pick from 'lodash/pick'
import { v4 as uuidv4 } from 'uuid'
import { Model } from '../renderer/packages/models/openai'
import { ClaudeModel } from '../renderer/packages/models/claude'

export interface MessagePicture {
    url?: string
    storageKey?: string
    loading?: boolean
}

// Chatbox 应用的消息类型
export type Message = OpenAIMessage & {
    id: string
    cancel?: () => void
    generating?: boolean
    aiProvider?: ModelProvider
    model?: string
    style?: string // image style

    pictures?: MessagePicture[]

    errorCode?: number
    error?: string
    errorExtra?: {
        [key: string]: any
    }

    wordCount?: number // 当前消息的字数
    tokenCount?: number // 当前消息的 token 数量
    tokensUsed?: number // 生成当前消息的 token 使用量
    timestamp?: number // 当前消息的时间戳
}

export type SettingWindowTab = 'ai' | 'display' | 'chat' | 'advanced'

export type SessionType = undefined | 'chat' | 'picture' // undefined 为了兼容老版本 chat

export function isChatSession(session: Session) {
    return session.type === 'chat' || !session.type
}
export function isPictureSession(session: Session) {
    return session.type === 'picture'
}

export interface Session {
    id: string
    type: SessionType
    name: string
    picUrl?: string
    messages: Message[]
    starred?: boolean
    copilotId?: string
    settings?: SessionSettings
    threads?: SessionThread[] // 历史话题列表
    threadName?: string // 当前话题名称
}

// 话题
export interface SessionThread {
    id: string
    name: string
    messages: Message[]
    createdAt: number
}

export interface SessionThreadBrief {
    id: string
    name: string
    createdAt?: number
    createdAtLabel?: string
    firstMessageId: string
    messageCount: number
}

export type SessionSettings = ReturnType<typeof settings2SessionSettings>
// TODO: 这里值得简单重构，将会话设置应该假定所有字段可能为空，在设置层面做好默认值的处理。这样可以防止字段覆盖冲突。
// export type SessionSettings = Partial<ModelSettings>

export function settings2SessionSettings(settings: ModelSettings) {
    return pick(settings, [
        'aiProvider',

        'chatboxAIModel',
        'openaiMaxContextMessageCount',
        'temperature',
        'topP',
        'dalleStyle',
        'imageGenerateNum',

        'model',
        'openaiCustomModel',
        // 'openaiMaxContextTokens',
        // 'openaiMaxTokens',

        'azureDeploymentName',
        'azureDalleDeploymentName',

        'claudeModel',

        'ollamaHost',
        'ollamaModel',
    ])
}

export function pickPictureSettings(settings: ModelSettings) {
    return pick(settings, ['dalleStyle', 'imageGenerateNum'])
}

export function createMessage(role: OpenAIRoleEnumType = OpenAIRoleEnum.User, content: string = ''): Message {
    return {
        id: uuidv4(),
        content: content,
        role: role,
        timestamp: new Date().getTime(),
    }
}

export enum ModelProvider {
    ChatboxAI = 'chatbox-ai',
    OpenAI = 'openai',
    Azure = 'azure',
    ChatGLM6B = 'chatglm-6b',
    Claude = 'claude',
    Gemini = 'gemini',
    Ollama = 'ollama',
}

export interface ModelSettings {
    aiProvider: ModelProvider

    // openai
    openaiKey: string
    apiHost: string
    model: Model | 'custom-model'
    openaiCustomModel?: string // OpenAI 自定义模型的 ID

    dalleStyle: 'vivid' | 'natural'
    imageGenerateNum: number // 生成图片的数量

    // azure
    azureEndpoint: string
    azureDeploymentName: string
    azureDalleDeploymentName: string // dall-e-3 的部署名称
    azureApikey: string

    // chatglm-6b
    chatglm6bUrl: string

    // chatbox-ai
    licenseKey?: string
    chatboxAIModel?: ChatboxAIModel
    licenseInstances?: {
        [key: string]: string
    }
    licenseDetail?: ChatboxAILicenseDetail

    // claude
    claudeApiKey: string
    claudeApiHost: string
    claudeModel: ClaudeModel

    // google gemini
    geminiAPIKey: string
    geminiAPIHost: string

    // ollama
    ollamaHost: string
    ollamaModel: string

    temperature: number
    topP: number
    // openaiMaxTokens: number // 生成消息的最大限制，是传入 OpenAI 接口的参数。0 代表不限制（不传递）
    // openaiMaxContextTokens: number // 聊天消息上下文的tokens限制。
    openaiMaxContextMessageCount: number // 聊天消息上下文的消息数量限制。超过20表示不限制
    // maxContextSize: string 弃用，字段名永远不在使用，避免老版本报错
    // maxTokens: string 弃用，字段名永远不在使用，避免老版本报错
}

export interface Settings extends ModelSettings {
    showWordCount?: boolean
    showTokenCount?: boolean
    showTokenUsed?: boolean
    showModelName?: boolean
    showMessageTimestamp?: boolean

    theme: ThemeMode
    language: Language
    languageInited?: boolean
    fontSize: number
    spellCheck: boolean

    disableQuickToggleShortcut?: boolean // 是否关闭快捷键切换窗口显隐

    defaultPrompt?: string // 新会话的默认 prompt

    proxy?: string // 代理地址

    allowReportingAndTracking: boolean // 是否允许错误报告和事件追踪

    userAvatarKey?: string // 用户头像的 key

    enableMarkdownRendering: boolean
    enableLaTeXRendering: boolean
}

export type Language = 'en' | 'zh-Hans' | 'zh-Hant' | 'ja' | 'ko' | 'ru' | 'de' | 'fr'

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

// vision 版本的 OpenAI 消息类型
export interface OpenAIMessageVision {
    role: OpenAIRoleEnumType
    content: (
        | {
              type: 'text'
              text: string
          }
        | {
              type: 'image_url'
              image_url: {
                  // 可以是 url，也可以是 base64
                  // data:image/jpeg;base64,{base64_image}
                  url: string
                  detail?: 'auto' | 'low' | 'high' // default: auto
              }
          }
    )[]
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

export interface ChatboxAILicenseDetail {
    type: ChatboxAIModel // 弃用，存在于老版本中
    name: string
    defaultModel: ChatboxAIModel
    remaining_quota_35: number
    remaining_quota_4: number
    remaining_quota_image: number
    image_used_count: number
    image_total_quota: number
    token_refreshed_time: string
    token_expire_time: string | null | undefined
}

export type ChatboxAIModel = 'chatboxai-3.5' | 'chatboxai-4'
