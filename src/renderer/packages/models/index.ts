import OpenAI from './openai'
import { Settings, Config, ModelProvider } from '../../../shared/types'
import IModel from './interfaces'
import ChatboxAI from './chatboxai'
import AzureOpenAI from './azure'
import ChatGLM from './chatglm'
import Claude from './claude'

export function getModel(setting: Settings, config: Config): IModel {
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
