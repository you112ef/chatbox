import OpenAI from './openai'
import { Settings, Config, ModelProvider } from '../../../shared/types'
import IModel from './interfaces'
import ChatboxAI from './chatboxai'
import AzureOpenAI from './azure'
import ChatGLM from './chatglm'
import Claude from './claude'

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
}

export const aiModelProviderList = [
    {
        value: ModelProvider.ChatboxAI,
        label: aiProviderNameHash[ModelProvider.ChatboxAI],
        featured: true,
    },
    {
        value: ModelProvider.OpenAI,
        label: aiProviderNameHash[ModelProvider.OpenAI],
    },
    {
        value: ModelProvider.Azure,
        label: aiProviderNameHash[ModelProvider.Azure],
    },
    {
        value: ModelProvider.ChatGLM6B,
        label: aiProviderNameHash[ModelProvider.ChatGLM6B],
    },
    {
        value: ModelProvider.Claude,
        label: aiProviderNameHash[ModelProvider.Claude],
    },
    // {
    //     value: 'hunyuan',
    //     label: '腾讯混元',
    //     disabled: true,
    // },
]
