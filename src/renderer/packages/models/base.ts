import * as promptFormat from '@/packages/prompts'
import * as settingActions from '@/stores/settingActions'
import { sequenceMessages } from '@/utils/message'
import { isEmpty, last } from 'lodash'
import { Message, MessageToolCalls, MessageWebBrowsing, ModelMeta } from 'src/shared/types'
import { webSearchExecutor } from '../web-search'
import { AIProviderNoImplementedPaintError } from './errors'

export interface ModelHelpers {
  isModelSupportVision(model: string): boolean
  isModelSupportToolUse(model: string): boolean
}

export interface ModelInterface {
  name: string
  modelMeta: ModelMeta
  isSupportToolUse(): boolean
  chat: (messages: Message[], options: CallChatCompletionOptions) => Promise<string>
  paint: (prompt: string, num: number, callback?: (picBase64: string) => any, signal?: AbortSignal) => Promise<string[]>
}

export interface CallChatCompletionOptions {
  signal?: AbortSignal
  onResultChange?: onResultChange
  webBrowsing?: boolean
}

export default abstract class Base implements ModelInterface {
  public name = 'Unknown'
  public modelMeta: ModelMeta = {}
  public static helpers: ModelHelpers

  public abstract isSupportToolUse(): boolean
  protected abstract callChatCompletion(messages: Message[], options: CallChatCompletionOptions): Promise<string>

  protected async callImageGeneration(prompt: string, signal?: AbortSignal): Promise<string> {
    throw new AIProviderNoImplementedPaintError(this.name)
  }

  public async chat(messages: Message[], options: CallChatCompletionOptions): Promise<string> {
    return this.callChatCompletion(messages, options)
  }

  public async paint(
    prompt: string,
    num: number,
    callback?: (picBase64: string) => any,
    signal?: AbortSignal
  ): Promise<string[]> {
    const concurrence: Promise<string>[] = []
    for (let i = 0; i < num; i++) {
      concurrence.push(
        this.callImageGeneration(prompt, signal).then((picBase64) => {
          if (callback) {
            callback(picBase64)
          }
          return picBase64
        })
      )
    }
    return await Promise.all(concurrence)
  }
}

export interface ResultChange {
  content?: string
  webBrowsing?: MessageWebBrowsing
  reasoningContent?: string
  toolCalls?: MessageToolCalls
}

export type onResultChangeWithCancel = (data: ResultChange & { cancel?: () => void }) => void
export type onResultChange = (data: ResultChange) => void
export type OnResultChangeWithCancel = onResultChangeWithCancel
export type OnResultChange = onResultChange
