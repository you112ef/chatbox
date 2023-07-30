import { Config, Settings, ModelProvider } from '../../shared/types'
import { ThemeMode } from '../../shared/types'
import { v4 as uuidv4 } from 'uuid'

export function settings(): Settings {
    return {
        aiProvider: ModelProvider.OpenAI,
        openaiKey: '',
        apiHost: 'https://api.openai.com',
        azureApikey: '',
        azureDeploymentName: '',
        azureEndpoint: '',
        chatglm6bUrl: '',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        openaiMaxTokens: 0,
        openaiMaxContextTokens: 4000,
        openaiMaxContextMessageCount: 10,
        // maxContextSize: "4000",
        // maxTokens: "2048",
        showWordCount: true,
        showTokenCount: false,
        showTokenUsed: true,
        showModelName: true,
        theme: ThemeMode.System,
        language: 'en',
        fontSize: 12,

        defaultPrompt: getDefaultPrompt(),
    }
}

export function configs(): Config {
    return { uuid: uuidv4() }
}

export function getDefaultPrompt() {
    return 'You are a helpful assistant. You can help me by answering my questions. You can also ask me questions.'
}
