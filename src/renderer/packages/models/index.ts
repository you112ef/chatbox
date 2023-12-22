import OpenAI from './openai'
import { Settings, Config, ModelProvider, SessionSettings, SessionType } from '../../../shared/types'
import ChatboxAI from './chatboxai'
import AzureOpenAI from './azure'
import ChatGLM from './chatglm'
import Claude from './claude'
import Gemini from './gemini'

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
        default:
            throw new Error('Cannot find model with provider: ' + setting.aiProvider)
    }
}

export const aiProviderNameHash = {
    [ModelProvider.OpenAI]: 'OpenAI API',
    [ModelProvider.Azure]: 'Azure OpenAI API',
    [ModelProvider.ChatGLM6B]: 'ChatGLM-6B',
    [ModelProvider.ChatboxAI]: 'Chatbox-AI',
    [ModelProvider.Claude]: 'Claude',
    [ModelProvider.Gemini]: 'Google Gemini',
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
        value: ModelProvider.ChatGLM6B,
        label: aiProviderNameHash[ModelProvider.ChatGLM6B],
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
    // {
    //     value: 'hunyuan',
    //     label: '腾讯混元',
    //     disabled: true,
    // },
]

export function getModelDisplayName(settings: SessionSettings, sessionType: SessionType) {
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
                return settings.model
            }
        case ModelProvider.Azure:
            if (sessionType === 'picture') {
                return `Azure OpenAI (${settings.azureDalleDeploymentName})`
            } else {
                return `Azure OpenAI (${settings.azureDeploymentName})`
            }
        case ModelProvider.ChatGLM6B:
            return 'ChatGLM-6B'
        case ModelProvider.ChatboxAI:
            if (sessionType === 'picture') {
                return `Chatbox AI (DALL-E-3)`
            } else {
                const model = settings.chatboxAIModel || 'chatboxai-3.5'
                return model.replace('chatboxai-', 'Chatbox AI ')
            }
        case ModelProvider.Claude:
            return settings.claudeModel
        case ModelProvider.Gemini:
            return 'Google (gemini-pro)'
        default:
            return 'unknown'
    }
}
