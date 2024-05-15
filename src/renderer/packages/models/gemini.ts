import { Message } from 'src/shared/types'
import Base, { onResultChange } from './base'
import { ApiError } from './errors'
import storage from '@/storage'
import * as base64 from '@/packages/base64'

export type GeminiModel = keyof typeof modelConfig

// https://ai.google.dev/models/gemini?hl=zh-cn
export const modelConfig = {
    'gemini-1.5-pro-latest': {
        vision: true,
    },
    'gemini-1.5-flash-latest': {
        vision: true,
    },
    'gemini-pro': {
        vision: false,
    },
}

export const geminiModels: GeminiModel[] = Object.keys(modelConfig) as GeminiModel[]

interface Options {
    geminiAPIKey: string
    geminiAPIHost: string
    geminiModel: GeminiModel
    temperature: number
}

export function isSupportVision(model: GeminiModel): boolean {
    return modelConfig[model]?.vision || false
}

export default class Gemeni extends Base {
    public name = 'Google Gemini Pro'

    public options: Options
    constructor(options: Options) {
        super()
        this.options = options
    }

    async callChatCompletion(messages: Message[], signal?: AbortSignal, onResultChange?: onResultChange): Promise<string> {
        const res = await this.post(
            `${this.options.geminiAPIHost}/v1beta/models/${this.options.geminiModel}:generateContent?key=${this.options.geminiAPIKey}`,
            {
                'Content-Type': 'application/json',
            },
            {
                "contents": await populateGeminiMessages(messages, this.options.geminiModel),
                "generationConfig": {
                    "temperature": this.options.temperature,
                    "topK": 1,
                    "topP": 1,
                    // "maxOutputTokens": 2048,
                    "stopSequences": []
                },
                "safetySettings": [
                    {
                        "category": "HARM_CATEGORY_HARASSMENT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_HATE_SPEECH",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            },
            signal,
        )
        const json = await res.json()
        if (res.status !== 200) {
            throw new ApiError(JSON.stringify(json))
        }
        const result = json['candidates']?.[0]?.['content']?.['parts']?.[0]?.['text'] || null
        if (result === null) {
            throw new ApiError(JSON.stringify(json))
        }
        if (onResultChange) {
            onResultChange(result)
        }
        return result
    }

    static isSupportVision(model: GeminiModel): boolean {
        return isSupportVision(model)
    }

}

interface Content {
    role: "user" | "model"
    parts: (TextPart | InlineDataPart)[]
}

interface TextPart {
    text: string
}

interface InlineDataPart {
    inlineData: { mimeType: string, data: string }
}

export async function populateGeminiMessages(messages: Message[], model: GeminiModel): Promise<Content[]> {
    const contents: Content[] = []
    let previousContent: Content | null = null
    for (const msg of messages) {
        switch (msg.role) {
            case 'system':
                if (previousContent === null) {
                    // 初始化第一条消息
                    previousContent = { role: 'user', parts: [{ text: msg.content }] }
                } else if (previousContent.role === 'model') {
                    // 若上条消息是机器人消息，那么将其加入上下文，并将本条 system 消息作为下一条用户消息
                    contents.push(previousContent)
                    previousContent = { role: 'user', parts: [{ text: msg.content }] }
                } else if (previousContent.role === 'user') {
                    // 若上条消息是用户消息，那么将本条 system 消息合并到上条用户消息中
                    previousContent.parts.push({ text: msg.content })
                }
                break;
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
                if (isSupportVision(model) && previousContent && msg.pictures && msg.pictures.length > 0) {
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
                break;
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
                break;
        }
    }
    if (previousContent !== null && previousContent.role === 'user') {
        // 最后一条必须是用户消息
        contents.push(previousContent)
    }
    return contents
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
