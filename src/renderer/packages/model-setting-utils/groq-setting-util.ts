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

  public getLocalOptionGroups(settings: ModelSettings) {
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

  protected async listProviderModels(settings: ModelSettings) {
    const groq = new Groq(settings)
    return groq.listModels()
  }

  selectSessionModel(settings: Session['settings'], selected: string): Session['settings'] {
    return {
      ...settings,
      groqModel: selected as GroqModel,
    }
  }

  public isCurrentModelSupportImageInput(settings: ModelSettings) {
    return Groq.helpers.isModelSupportVision(settings.groqModel)
  }

  public isCurrentModelSupportToolUse(settings: ModelSettings) {
    return Groq.helpers.isModelSupportToolUse(settings.groqModel)
  }
}
