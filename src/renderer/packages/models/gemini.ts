import * as base64 from '@/packages/base64'
import storage from '@/storage'
import { apiRequest } from '@/utils/request'
import { handleSSE } from '@/utils/stream'
import { compact } from 'lodash'
import { Message } from 'src/shared/types'
import Base, { CallChatCompletionOptions, ModelHelpers } from './base'
import { ApiError } from './errors'

export type GeminiModel = keyof typeof modelConfig

// https://ai.google.dev/models/gemini?hl=zh-cn
export const modelConfig = {
  'gemini-2.0-flash-exp': {
    vision: true,
  },
  'gemini-2.0-flash-thinking-exp': {
    vision: true,
  },
  'gemini-2.0-flash-thinking-exp-1219': {
    vision: true,
  },
  'gemini-1.5-pro-latest': {
    vision: true,
  },
  'gemini-1.5-flash-latest': {
    vision: true,
  },
  'gemini-1.5-pro-exp-0827': {
    vision: true,
  },
  'gemini-1.5-flash-exp-0827': {
    vision: true,
  },
  'gemini-1.5-flash-8b-exp-0924': {
    vision: true,
  },
  'gemini-pro': {
    vision: false,
  },
}

export const geminiModels: GeminiModel[] = Object.keys(modelConfig) as GeminiModel[]

const helpers: ModelHelpers = {
  isModelSupportVision: (model: string) => {
    if (model.startsWith('gemini-pro') && !model.includes('vision')) {
      return false
    }
    if (model.startsWith('gemini-1.0')) {
      return false
    }
    return true
  },
  isModelSupportToolUse: (model: string) => {
    return true
  },
}

interface Options {
  geminiAPIKey: string
  geminiAPIHost: string
  geminiModel: GeminiModel
  temperature: number
}

export default class Gemeni extends Base {
  public name = 'Google Gemini'
  public static helpers = helpers

  constructor(public options: Options) {
    super()
  }

  isSupportToolUse() {
    return helpers.isModelSupportToolUse(this.options.geminiModel)
  }

  async callChatCompletion(messages: Message[], options: CallChatCompletionOptions): Promise<string> {
    const { contents, systemInstruction } = await populateGeminiMessages(
      messages,
      this.options.geminiModel,
      options.webBrowsing
    )
    const res = await apiRequest.post(
      `${this.options.geminiAPIHost}/v1beta/models/${this.options.geminiModel}:streamGenerateContent?alt=sse&key=${this.options.geminiAPIKey}`,
      {
        'Content-Type': 'application/json',
      },
      {
        contents,
        ...(systemInstruction
          ? {
              system_instruction: {
                parts: [{ text: systemInstruction }],
              },
            }
          : {}),
        ...(options.webBrowsing
          ? {
              tools: [
                {
                  googleSearch: {},
                },
              ],
            }
          : {}),
        // "generationConfig": {
        //     "temperature": this.options.temperature,
        //     "topK": 1,
        //     "topP": 1,
        //     // "maxOutputTokens": 2048,
        //     "stopSequences": []
        // },
        // "safetySettings": [
        //     {
        //         "category": "HARM_CATEGORY_HATE_SPEECH",
        //         "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        //     },
        //     {
        //         "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        //         "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        //     },
        //     {
        //         "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        //         "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        //     }
        // ]
      },
      { signal: options.signal }
    )
    let result = ''
    await handleSSE(res, (message) => {
      const data = JSON.parse(message)
      if (data.error) {
        throw new ApiError(`Error from Gemini: ${JSON.stringify(data)}`)
      }
      const text = data.candidates[0]?.content?.parts[0]?.text
      if (text !== undefined) {
        result += text
        options.onResultChange?.({ content: result })
      }
      const groundingMetadata = data.candidates[0]?.groundingMetadata as
        | {
            searchEntryPoint?: { renderedContent?: string }
            groundingChunks?: { web?: { uri: string; title: string } }[]
            webSearchQueries?: string[]
          }
        | undefined
      // "groundingMetadata": {
      //     "searchEntryPoint": {
      //         "renderedContent": "\u003e\n"
      //     },
      //     "groundingChunks": [
      //         {
      //             "web": {
      //                 "uri": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AYygrcSl--fy9oPJcYiLMwIdIcKyLvMSU9sWtz4G0nNE5_4jsnQ5KVxQ8wXoXnCvnop7ycDT-tcNgdWuXpWBkttViFjkNZe4rrbilA5t9_jssnZeF8BL8Jyis__Xo64TWp0vDV9tUouCkYVueSEuxAqR_jL98lLE4m91D46onD2iADev4ro=",
      //                 "title": "szns.gov.cn"
      //             }
      //         },
      //         {
      //             "web": {
      //                 "uri": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AYygrcSvvROcRBGIlf02Tc7zwMkhwn7dHYxhI6WgrSmywsdeIynBffFpNsD46UwUSoyMM6nKgpjk-0fytHEHdadk37U1YT3MK3yP8WXNIfDW6LKqwKkPjjIeyXRRs5PUHr2xEWhh_NRAte4=",
      //                 "title": "121.com.cn"
      //             }
      //         },
      //         {
      //             "web": {
      //                 "uri": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AYygrcSXZhXaYAyc6bCFF4zLN31Fd6kfac7OZL2YE1KItU2frz7F9FMSDqNsmLYhqAbJoGI_fMTQX8goyB8VYbVtiwItrtzZmegJpmg1R4YEhJEJkzSnZjQZ5RtqCmLxDpM1Zw_HgFkDbP84",
      //                 "title": "weather.com.cn"
      //             }
      //         }
      //     ],
      //     "groundingSupports": [
      //         {
      //             "segment": {
      //                 "endIndex": 42,
      //                 "text": "好的，今天深圳的天气是多云。"
      //             },
      //             "groundingChunkIndices": [
      //                 0,
      //                 1
      //             ],
      //             "confidenceScores": [
      //                 0.7090249,
      //                 0.6010466
      //             ]
      //         },
      //         {
      //             "segment": {
      //                 "startIndex": 128,
      //                 "endIndex": 149,
      //                 "text": "*   早晨：14-19°C"
      //             },
      //             "groundingChunkIndices": [
      //                 1
      //             ],
      //             "confidenceScores": [
      //                 0.6878241
      //             ]
      //         },
      //         {
      //             "segment": {
      //                 "startIndex": 509,
      //                 "endIndex": 548,
      //                 "text": "*   后天：多云，气温10-12°C。"
      //             },
      //             "groundingChunkIndices": [
      //                 2
      //             ],
      //             "confidenceScores": [
      //                 0.82308143
      //             ]
      //         }
      //     ],
      //     "webSearchQueries": [
      //         "What is the weather in Shenzhen?",
      //         "Shenzhen weather",
      //         "深圳的天气怎样？"
      //     ]
      // }
      if (groundingMetadata) {
        options.onResultChange?.({
          content: result,
          webBrowsing: {
            query: groundingMetadata.webSearchQueries || [],
            links: compact(
              (groundingMetadata.groundingChunks || []).map((chunk) => {
                if (chunk.web) {
                  return {
                    title: chunk.web?.title,
                    url: chunk.web?.uri,
                  }
                }
                return null
              })
            ),
          },
        })
      }
    })
    return result
  }

  async listModels(): Promise<string[]> {
    // https://ai.google.dev/api/models#method:-models.list
    type Response = {
      models: {
        name: string
        version: string
        displayName: string
        description: string
        inputTokenLimit: number
        outputTokenLimit: number
        supportedGenerationMethods: string[]
        temperature: number
        topP: number
        topK: number
      }[]
    }
    const res = await apiRequest.get(`${this.options.geminiAPIHost}/v1beta/models?key=${this.options.geminiAPIKey}`, {})
    const json: Response = await res.json()
    if (!json['models']) {
      throw new ApiError(JSON.stringify(json))
    }
    return json['models']
      .filter((m) => m['supportedGenerationMethods'].some((method) => method.includes('generate')))
      .filter((m) => m['name'].includes('gemini'))
      .map((m) => m['name'].replace('models/', ''))
      .sort()
  }
}

interface Content {
  role: 'user' | 'model'
  parts: (TextPart | InlineDataPart)[]
}

interface TextPart {
  text: string
}

interface InlineDataPart {
  inlineData: { mimeType: string; data: string }
}

export async function populateGeminiMessages(
  messages: Message[],
  model: GeminiModel,
  webBrowsing?: boolean
): Promise<{
  contents: Content[]
  systemInstruction: string
}> {
  const contents: Content[] = []
  let previousContent: Content | null = null
  let systemInstruction = ''
  for (const msg of messages) {
    switch (msg.role) {
      case 'system':
        if (!model.startsWith('gemini-pro') && !model.startsWith('gemini-1.0') && !model.startsWith('gemini-exp')) {
          systemInstruction = msg.content
        }
        break
      case 'user':
        if (previousContent === null) {
          // 初始化第一条消息
          previousContent = { role: 'user', parts: [{ text: msg.content }] }
        } else if (previousContent.role === 'model') {
          // 若上条消息是机器人消息，那么将其加入到上下文，并将本条用户消息作为下一条用户消息
          contents.push(previousContent)
          previousContent = { role: 'user', parts: [{ text: msg.content }] }
        } else if (previousContent.role === 'user') {
          // 若上条消息是用户消息，那么将本条用户消息合并到上条用户消息中
          previousContent.parts.push({ text: msg.content })
        }
        if (helpers.isModelSupportVision(model) && previousContent && msg.pictures && msg.pictures.length > 0) {
          for (const pic of msg.pictures) {
            if (!pic.storageKey) {
              continue
            }
            const picBase64 = await storage.getBlob(pic.storageKey)
            if (!picBase64) {
              continue
            }
            const picData = base64.parseImage(picBase64)
            if (!picData.type || !picData.data) {
              continue
            }
            previousContent.parts.push({ inlineData: { mimeType: picData.type, data: picData.data } })
          }
        }
        break
      case 'assistant':
        if (previousContent === null) {
          // 第一条消息如果是机器人消息，那么忽略
          continue
        } else if (previousContent.role === 'model') {
          // 当连续多条机器人消息时，只保留最后一条
          // 若上条消息是机器人消息，那么遗弃并将本条机器人消息作为下一条机器人消息
          previousContent = { role: 'model', parts: [{ text: msg.content }] }
        } else if (previousContent.role === 'user') {
          // 若上条消息是用户消息，那么将其加入到上下文，并将本条机器人消息作为下一条机器人消息
          contents.push(previousContent)
          previousContent = { role: 'model', parts: [{ text: msg.content }] }
        }
      default:
        break
    }
  }
  if (previousContent !== null && previousContent.role === 'user') {
    // 最后一条必须是用户消息
    contents.push(previousContent)
  }
  if (webBrowsing) {
    systemInstruction += `
        
Before answering any question, please search the web for the most up-to-date and accurate information. Base your response on both your training data and current online sources.
Please acknowledge that you have searched the web before providing your answer.
Always respond in the same language as the user's query, and cite your sources when possible.`
  }
  return { contents, systemInstruction }
}

// #!/bin/bash

// API_KEY="YOUR_API_KEY"

// curl \
//   -X POST 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key='${API_KEY} \
//   -H 'Content-Type: application/json' \
//   -d @<(echo '{
//   "contents": [
//     {
//       "role": "user",
//       "parts": [
//         {
//           "text": "hi"
//         }
//       ]
//     },
//     {
//       "role": "model",
//       "parts": [
//         {
//           "text": "Hello! How can I assist you today? I'm here to answer your"
//         }
//       ]
//     },
//     {
//       "role": "user",
//       "parts": [
//         {
//           "text": "<div><br></div>hi"
//         }
//       ]
//     }
//   ],
//   "generationConfig": {
//     "temperature": 0.9,
//     "topK": 1,
//     "topP": 1,
//     "maxOutputTokens": 2048,
//     "stopSequences": []
//   },
//   "safetySettings": [
//     {
//       "category": "HARM_CATEGORY_HARASSMENT",
//       "threshold": "BLOCK_MEDIUM_AND_ABOVE"
//     },
//     {
//       "category": "HARM_CATEGORY_HATE_SPEECH",
//       "threshold": "BLOCK_MEDIUM_AND_ABOVE"
//     },
//     {
//       "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
//       "threshold": "BLOCK_MEDIUM_AND_ABOVE"
//     },
//     {
//       "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
//       "threshold": "BLOCK_MEDIUM_AND_ABOVE"
//     }
//   ]
// }')

// {
//     "candidates": [
//         {
//             "content": {
//                 "parts": [
//                     {
//                         "text": "Hello again! Is there anything specific you'd like to ask or need assistance with? I'm here to help in any way I can."
//                     }
//                 ],
//                 "role": "model"
//             },
//             "finishReason": "STOP",
//             "index": 0,
//             "safetyRatings": [
//                 {
//                     "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
//                     "probability": "NEGLIGIBLE"
//                 },
//                 {
//                     "category": "HARM_CATEGORY_HATE_SPEECH",
//                     "probability": "NEGLIGIBLE"
//                 },
//                 {
//                     "category": "HARM_CATEGORY_HARASSMENT",
//                     "probability": "NEGLIGIBLE"
//                 },
//                 {
//                     "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
//                     "probability": "NEGLIGIBLE"
//                 }
//             ]
//         }
//     ],
//     "promptFeedback": {
//         "safetyRatings": [
//             {
//                 "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
//                 "probability": "NEGLIGIBLE"
//             },
//             {
//                 "category": "HARM_CATEGORY_HATE_SPEECH",
//                 "probability": "NEGLIGIBLE"
//             },
//             {
//                 "category": "HARM_CATEGORY_HARASSMENT",
//                 "probability": "NEGLIGIBLE"
//             },
//             {
//                 "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
//                 "probability": "NEGLIGIBLE"
//             }
//         ]
//     }
// }
