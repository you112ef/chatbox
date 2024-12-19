import { Theme, Config, Settings, ModelProvider, Session } from './types'
import { v4 as uuidv4 } from 'uuid'

export function settings(): Settings {
    return {
        aiProvider: ModelProvider.OpenAI,
        openaiKey: '',
        apiHost: 'https://api.openai.com',
        dalleStyle: 'vivid',
        imageGenerateNum: 3,
        openaiUseProxy: false,

        azureApikey: '',
        azureDeploymentName: '',
        azureDeploymentNameOptions: [],
        azureDalleDeploymentName: 'dall-e-3',
        azureEndpoint: '',
        chatglm6bUrl: '',
        model: 'gpt-4o',
        openaiCustomModelOptions: [],
        temperature: 0.7,
        topP: 1,
        // openaiMaxTokens: 0,
        // openaiMaxContextTokens: 4000,
        openaiMaxContextMessageCount: 20,
        // maxContextSize: "4000",
        // maxTokens: "2048",

        claudeApiKey: '',
        claudeApiHost: 'https://api.anthropic.com',
        claudeModel: 'claude-3-5-sonnet-20241022',

        geminiAPIKey: '',
        geminiAPIHost: 'https://generativelanguage.googleapis.com',
        geminiModel: 'gemini-1.5-pro-latest',

        ollamaHost: 'http://127.0.0.1:11434',
        ollamaModel: '',

        groqAPIKey: '',
        groqModel: 'llama3-70b-8192',

        customProviders: [],

        showWordCount: false,
        showTokenCount: false,
        showTokenUsed: true,
        showModelName: true,
        showMessageTimestamp: false,
        userAvatarKey: '',
        defaultAssistantAvatarKey: '',
        theme: Theme.System,
        language: 'en',
        fontSize: 12,
        spellCheck: true,

        defaultPrompt: getDefaultPrompt(),

        allowReportingAndTracking: true,

        enableMarkdownRendering: true,
        enableLaTeXRendering: true,
        enableMermaidRendering: true,
        injectDefaultMetadata: true,
        autoPreviewArtifacts: false,
        autoCollapseCodeBlock: true,

        autoGenerateTitle: true,

        autoLaunch: false,
    }
}

export function newConfigs(): Config {
    return { uuid: uuidv4() }
}

export function getDefaultPrompt() {
    return 'You are a helpful assistant.'
}

export function sessions(): Session[] {
    return [{ id: uuidv4(), name: 'Untitled', messages: [], type: 'chat' }]
}
