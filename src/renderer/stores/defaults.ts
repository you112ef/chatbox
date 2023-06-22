import { Config, Settings, ModelProvider } from '../types'
import { ThemeMode } from '../types'
import { v4 as uuidv4 } from 'uuid';

export function settings(): Settings {
    return {
        aiProvider: ModelProvider.OpenAI,
        openaiKey: '',
        apiHost: 'https://api.openai.com',
        azureApikey: '',
        azureDeploymentName: '',
        azureEndpoint: '',
        chatglm6bUrl: '',
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        openaiMaxTokens: 0,
        openaiMaxContextTokens: 4000,
        // maxContextSize: "4000",
        // maxTokens: "2048",
        showWordCount: false,
        showTokenCount: false,
        showModelName: false,
        theme: ThemeMode.System,
        language: 'en',
        fontSize: 13,
    }
}

export function configs(): Config {
    return { uuid: uuidv4() }
}
