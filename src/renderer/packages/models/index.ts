import OpenAI from './openai'
import { Settings, Config, ModelProvider } from '../../../shared/types'
import ChatboxAI from './chatboxai'
import AzureOpenAI from './azure'
import ChatGLM from './chatglm'
import Claude from './claude'
import Gemini from './gemini'
import Ollama from './ollama'
import LMStudio from './lmstudio'
import Groq from './groq'
import DeepSeek from './deepseek'
import SiliconFlow from './siliconflow'
import Perplexity from './perplexity'
import XAI from './xai'
import type { ModelInterface } from './base'

export function getModel(setting: Settings, config: Config): ModelInterface {
  switch (setting.aiProvider) {
    case ModelProvider.ChatboxAI:
      return new ChatboxAI(setting, config)
    case ModelProvider.OpenAI:
      return new OpenAI({ ...setting, apiPath: undefined }) // 因为 OpenAI 会修改传入的 option，如果不复制可能导致状态异常
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
    case ModelProvider.DeepSeek:
      return new DeepSeek(setting)
    case ModelProvider.SiliconFlow:
      return new SiliconFlow(setting)
    case ModelProvider.LMStudio:
      return new LMStudio(setting)
    case ModelProvider.Perplexity:
      return new Perplexity(setting)
    case ModelProvider.XAI:
      return new XAI(setting)
    case ModelProvider.Custom:
      const customProvider = setting.customProviders.find(
        (provider) => provider.id === setting.selectedCustomProviderId
      )
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
        openaiUseProxy: customProvider.useProxy || false,
      })
    default:
      throw new Error('Cannot find model with provider: ' + setting.aiProvider)
  }
}

export const aiProviderNameHash: Record<ModelProvider, string> = {
  [ModelProvider.OpenAI]: 'OpenAI API',
  [ModelProvider.Azure]: 'Azure OpenAI API',
  [ModelProvider.ChatGLM6B]: 'ChatGLM API',
  [ModelProvider.ChatboxAI]: 'Chatbox AI',
  [ModelProvider.Claude]: 'Claude API',
  [ModelProvider.Gemini]: 'Google Gemini API',
  [ModelProvider.Ollama]: 'Ollama API',
  [ModelProvider.Groq]: 'Groq API',
  [ModelProvider.DeepSeek]: 'DeepSeek API',
  [ModelProvider.SiliconFlow]: 'SiliconFlow API',
  [ModelProvider.LMStudio]: 'LM Studio API',
  [ModelProvider.Perplexity]: 'Perplexity API',
  [ModelProvider.XAI]: 'xAI API',
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
    value: ModelProvider.LMStudio,
    label: aiProviderNameHash[ModelProvider.LMStudio],
    disabled: false,
  },
  {
    value: ModelProvider.DeepSeek,
    label: aiProviderNameHash[ModelProvider.DeepSeek],
    disabled: false,
  },
  {
    value: ModelProvider.SiliconFlow,
    label: aiProviderNameHash[ModelProvider.SiliconFlow],
    disabled: false,
  },
  {
    value: ModelProvider.Azure,
    label: aiProviderNameHash[ModelProvider.Azure],
    disabled: false,
  },
  {
    value: ModelProvider.XAI,
    label: aiProviderNameHash[ModelProvider.XAI],
    disabled: false,
  },
  {
    value: ModelProvider.Perplexity,
    label: aiProviderNameHash[ModelProvider.Perplexity],
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
