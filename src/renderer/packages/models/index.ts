import OpenAI from './openai'
import { Settings, Config, ModelProvider, SessionType, ModelSettings } from '../../../shared/types'
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
        case ModelProvider.Custom:
            const customProvider = setting.customProviders.find((provider) => provider.id === setting.selectedCustomProviderId)
            if (!customProvider) {
                throw new Error('Cannot find the custom provider')
            }
            return new OpenAI({
                openaiKey: customProvider.key,
                apiHost: customProvider.host,
                apiPath: customProvider.path,
                model: 'custom-model',
                openaiCustomModel: customProvider.model,
                dalleStyle: 'vivid',
                // openaiMaxTokens: number
                temperature: keepRange(setting.temperature, 0.1, 0.9),
                topP: keepRange(setting.topP, 0.1, 0.9),
                injectDefaultMetadata: setting.injectDefaultMetadata,
            })
        default:
            throw new Error('Cannot find model with provider: ' + setting.aiProvider)
    }
}

export const aiProviderNameHash: Record<ModelProvider, string> = {
    [ModelProvider.OpenAI]: 'OpenAI API',
    [ModelProvider.Azure]: 'Azure OpenAI API',
    [ModelProvider.ChatGLM6B]: 'ChatGLM',
    [ModelProvider.ChatboxAI]: 'Chatbox AI',
    [ModelProvider.Claude]: 'Claude',
    [ModelProvider.Gemini]: 'Google Gemini',
    [ModelProvider.Ollama]: 'Ollama',
    [ModelProvider.Groq]: 'Groq',
    [ModelProvider.Custom]: 'Custom Provider',
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

function keepRange(num: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, num))
}
