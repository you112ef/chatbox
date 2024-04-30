import OpenAI from './openai'
import { Settings, Config, ModelProvider, SessionType, ModelSettings, Session } from '../../../shared/types'
import ChatboxAI from './chatboxai'
import AzureOpenAI from './azure'
import ChatGLM from './chatglm'
import Claude from './claude'
import Gemini from './gemini'
import Ollama from './ollama'
import Groq from './groq'

export function getModel(setting: Settings, config: Config) {
    switch (setting.aiProvider) {
        case ModelProvider.ChatboxAI:
            return new ChatboxAI(setting, config)
        case ModelProvider.OpenAI:
            return new OpenAI(setting)
        case ModelProvider.Azure:
            return new AzureOpenAI(setting)
        case ModelProvider.ChatGLM6B:
            return new ChatGLM(setting)
        case ModelProvider.Claude:
            return new Claude(setting)
        case ModelProvider.Gemini:
            return new Gemini(setting)
        case ModelProvider.Ollama:
            return new Ollama(setting)
        case ModelProvider.Groq:
            return new Groq(setting)
        default:
            throw new Error('Cannot find model with provider: ' + setting.aiProvider)
    }
}

export const aiProviderNameHash = {
    [ModelProvider.OpenAI]: 'OpenAI API',
    [ModelProvider.Azure]: 'Azure OpenAI API',
    [ModelProvider.ChatGLM6B]: 'ChatGLM',
    [ModelProvider.ChatboxAI]: 'Chatbox AI',
    [ModelProvider.Claude]: 'Claude',
    [ModelProvider.Gemini]: 'Google Gemini',
    [ModelProvider.Ollama]: 'Ollama',
    [ModelProvider.Groq]: 'Groq',
}

export const AIModelProviderMenuOptionList = [
    {
        value: ModelProvider.ChatboxAI,
        label: aiProviderNameHash[ModelProvider.ChatboxAI],
        featured: true,
        disabled: false,
    },
    {
        value: ModelProvider.OpenAI,
        label: aiProviderNameHash[ModelProvider.OpenAI],
        disabled: false,
    },
    {
        value: ModelProvider.Azure,
        label: aiProviderNameHash[ModelProvider.Azure],
        disabled: false,
    },
    {
        value: ModelProvider.Claude,
        label: aiProviderNameHash[ModelProvider.Claude],
        disabled: false,
    },
    {
        value: ModelProvider.Gemini,
        label: aiProviderNameHash[ModelProvider.Gemini],
        disabled: false,
    },
    {
        value: ModelProvider.Ollama,
        label: aiProviderNameHash[ModelProvider.Ollama],
        disabled: false,
    },
    {
        value: ModelProvider.Groq,
        label: aiProviderNameHash[ModelProvider.Groq],
        disabled: false,
    },
    {
        value: ModelProvider.ChatGLM6B,
        label: aiProviderNameHash[ModelProvider.ChatGLM6B],
        disabled: false,
    },
    // {
    //     value: 'hunyuan',
    //     label: '腾讯混元',
    //     disabled: true,
    // },
]

export function getModelDisplayName(settings: Session['settings'], sessionType: SessionType): string {
    if (!settings) {
        return 'unknown'
    }
    switch (settings.aiProvider) {
        case ModelProvider.OpenAI:
            if (sessionType === 'picture') {
                return `OpenAI (DALL-E-3)`
            } else {
                if (settings.model === 'custom-model') {
                    let name = settings.openaiCustomModel || ''
                    if (name.length >= 10) {
                        name = name.slice(0, 10) + '...'
                    }
                    return `OpenAI Custom Model (${name})`
                }
                return settings.model || 'unknown'
            }
        case ModelProvider.Azure:
            if (sessionType === 'picture') {
                return `Azure OpenAI (${settings.azureDalleDeploymentName})`
            } else {
                return `Azure OpenAI (${settings.azureDeploymentName})`
            }
        case ModelProvider.ChatGLM6B:
            return 'ChatGLM'
        case ModelProvider.ChatboxAI:
            if (sessionType === 'picture') {
                return `Chatbox AI (DALL-E-3)`
            } else {
                const model = settings.chatboxAIModel || 'chatboxai-3.5'
                return model.replace('chatboxai-', 'Chatbox AI ')
            }
        case ModelProvider.Claude:
            return settings.claudeModel || 'unknown'
        case ModelProvider.Gemini:
            return `Google (${settings.geminiModel})`
        case ModelProvider.Ollama:
            return `Ollama (${settings.ollamaModel})`
        case ModelProvider.Groq:
            return `Groq (${settings.groqModel})`
        default:
            return 'unknown'
    }
}

export function isCurrentModelSupportImageInput(settings: ModelSettings) {
    return (settings.aiProvider === ModelProvider.ChatboxAI && settings.chatboxAIModel === 'chatboxai-4')
        || (settings.aiProvider === ModelProvider.OpenAI && ['gpt-4-turbo', 'gpt-4-vision-preview', 'custom-model'].includes(settings.model))
        || (settings.aiProvider === ModelProvider.Azure && settings.azureDeploymentName === 'gpt-4-vision-preview')
        || (settings.aiProvider === ModelProvider.Claude && settings.claudeModel.startsWith('claude-3'))
}
