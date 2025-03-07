import { ModelSettings, Session, SessionType, Settings } from 'src/shared/types'
import { ModelSettingUtil } from './interface'
import { GroqModel, groqModels } from '../models/groq'
import BaseConfig from './base-config'
import Groq from '../models/groq'

export default class GroqSettingUtil extends BaseConfig implements ModelSettingUtil {
  async getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): Promise<string> {
    return `Groq API (${settings.groqModel})`
  }

  getCurrentModelOptionValue(settings: Settings) {
    return settings.groqModel
  }

  getLocalOptionGroups(settings: Settings) {
    return [
      {
        options: [...groqModels].sort().map((value) => {
          return {
            label: value,
            value: value,
          }
        }),
      },
    ]
  }

  async getRemoteOptionGroups(settings: Settings) {
    const remoteModels = await super.getRemoteOptionGroups(settings).catch(() => [])
    const groq = new Groq(settings)
    const groqAPIModels = await groq.listModels().catch(() => [])
    return [
      ...remoteModels,
      {
        options: groqAPIModels.map((model) => {
          return {
            label: model,
            value: model,
          }
        }),
      },
    ]
  }

  selectSessionModel(settings: Session['settings'], selected: string): Session['settings'] {
    return {
      ...settings,
      groqModel: selected as GroqModel,
    }
  }

  isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
    return true
  }
}
