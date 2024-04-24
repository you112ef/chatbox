import { ThemeMode, Config, Settings, ModelProvider, Session } from './types'
import { v4 as uuidv4 } from 'uuid'

export function settings(): Settings {
    return {
        aiProvider: ModelProvider.OpenAI,
        openaiKey: '',
        apiHost: 'https://api.openai.com',
        dalleStyle: 'vivid',
        imageGenerateNum: 3,

        azureApikey: '',
        azureDeploymentName: '',
        azureDalleDeploymentName: 'dall-e-3',
        azureEndpoint: '',
        chatglm6bUrl: '',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        topP: 1,
        // openaiMaxTokens: 0,
        // openaiMaxContextTokens: 4000,
        openaiMaxContextMessageCount: 10,
        // maxContextSize: "4000",
        // maxTokens: "2048",

        claudeApiKey: '',
        claudeApiHost: 'https://api.anthropic.com',
        claudeModel: 'claude-2.1',

        geminiAPIKey: '',
        geminiAPIHost: 'https://generativelanguage.googleapis.com',
        geminiModel: 'gemini-pro',

        ollamaHost: 'http://localhost:11434',
        ollamaModel: '',

        groqAPIKey: '',
        groqModel: 'llama3-70b-8192',

        showWordCount: true,
        showTokenCount: false,
        showTokenUsed: true,
        showModelName: true,
        showMessageTimestamp: false,
        userAvatarKey: '',
        theme: ThemeMode.System,
        language: 'en',
        fontSize: 12,
        spellCheck: true,

        defaultPrompt: getDefaultPrompt(),

        allowReportingAndTracking: true,

        enableMarkdownRendering: true,
        enableLaTeXRendering: true,
    }
}

export function newConfigs(): Config {
    return { uuid: uuidv4() }
}

export function getDefaultPrompt() {
    return 'You are a helpful assistant. You can help me by answering my questions. You can also ask me questions.'
}

export function sessions(): Session[] {
    return [{ id: uuidv4(), name: 'Untitled', messages: [], type: 'chat' }]
}
