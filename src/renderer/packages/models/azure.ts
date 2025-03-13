import { Message } from 'src/shared/types'
import Base, { onResultChange, ModelHelpers } from './base'
import { ApiError } from './errors'
import {
  injectModelSystemPrompt,
  openaiModelConfigs,
  populateGPTMessage,
  populateOSeriesMessage,
  isOSeriesModel,
} from './openai'
import * as settingActions from '@/stores/settingActions'
import { apiRequest } from '@/utils/request'
import { handleSSE } from '@/utils/stream'

const helpers: ModelHelpers = {
  isModelSupportVision: (model: string) => {
    const list = ['gpt-4-vision-preview', 'gpt-4o', 'gpt-4o-mini']
    return list.includes(model) || list.includes(model.toLowerCase())
  },
  isModelSupportToolUse: (model: string) => {
    return false
  },
}

interface Options {
  azureEndpoint: string
  azureDeploymentName: string
  azureDalleDeploymentName: string // dall-e-3 的部署名称
  azureApikey: string

  // openaiMaxTokens: number
  temperature: number
  topP: number

  dalleStyle: 'vivid' | 'natural'
  imageGenerateNum: number // 生成图片的数量

  injectDefaultMetadata: boolean
}

export default class AzureOpenAI extends Base {
  public name = 'Azure OpenAI'
  public static helpers = helpers

  constructor(public options: Options) {
    super()
  }

  private getApiVersion() {
    return settingActions.getSettings().azureApiVersion
  }

  async callChatCompletion(
    rawMessages: Message[],
    signal?: AbortSignal,
    onResultChange?: onResultChange
  ): Promise<string> {
    if (this.options.injectDefaultMetadata) {
      rawMessages = injectModelSystemPrompt(this.options.azureDeploymentName, rawMessages)
    }

    const isOSeries = isOSeriesModel((this.options.azureDeploymentName || '').toLowerCase())
    const params = isOSeries
      ? {
          messages: await populateOSeriesMessage(rawMessages, (this.options.azureDeploymentName || '').toLowerCase()),
          model: this.options.azureDeploymentName,
        }
      : {
          messages: await populateGPTMessage(rawMessages, this.options.azureDeploymentName as any),
          model: this.options.azureDeploymentName,
          // vision 模型的默认 max_tokens 极低，基本很难回答完整，因此手动设置为模型最大值
          max_tokens:
            this.options.azureDalleDeploymentName.toLowerCase() === 'gpt-4-vision-preview'
              ? openaiModelConfigs['gpt-4-vision-preview'].maxTokens
              : undefined,
          temperature: this.options.temperature,
          top_p: this.options.topP,
          stream: true,
        }

    const origin = new URL((this.options.azureEndpoint || '').trim()).origin
    const apiVersion = this.getApiVersion()
    const url = `${origin}/openai/deployments/${this.options.azureDeploymentName}/chat/completions?api-version=${apiVersion}`
    const response = await apiRequest.post(url, this.getHeaders(), params, { signal })
    if (isOSeries) {
      const json = await response.json()
      if (json.error) {
        throw new ApiError(`Error from Azure OpenAI: ${JSON.stringify(json)}`)
      }
      const content: string = json.choices[0].message.content || ''
      if (onResultChange) {
        onResultChange({ content })
      }
      return content
    } else {
      let result = ''
      await handleSSE(response, (message) => {
        if (message === '[DONE]') {
          return
        }
        const data = JSON.parse(message)
        if (data.error) {
          throw new ApiError(`Error from Azure OpenAI: ${JSON.stringify(data)}`)
        }
        const text = data.choices[0]?.delta?.content
        if (text !== undefined) {
          result += text
          if (onResultChange) {
            onResultChange({ content: result })
          }
        }
      })
      return result
    }
  }

  async callImageGeneration(prompt: string, signal?: AbortSignal): Promise<string> {
    const origin = new URL((this.options.azureEndpoint || '').trim()).origin
    const apiVersion = this.getApiVersion()
    const url = `${origin}/openai/deployments/${this.options.azureDalleDeploymentName}/images/generations?api-version=${apiVersion}`
    const res = await apiRequest.post(
      url,
      this.getHeaders(),
      {
        prompt,
        response_format: 'b64_json',
        model: 'dall-e-3',
        style: this.options.dalleStyle,
      },
      { signal }
    )
    const json = await res.json()
    return json['data'][0]['b64_json']
  }

  getHeaders() {
    return {
      'api-key': this.options.azureApikey,
      'Content-Type': 'application/json',
    }
  }

  isSupportToolUse() {
    return helpers.isModelSupportToolUse(this.options.azureDeploymentName)
  }
}
