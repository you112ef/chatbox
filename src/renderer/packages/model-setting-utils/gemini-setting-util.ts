import { ModelSettings, Session, SessionType, Settings } from 'src/shared/types'
import { ModelSettingUtil } from './interface'
import Gemini, { GeminiModel, geminiModels } from '../models/gemini'
import BaseConfig from './base-config'

export default class GeminiSettingUtil extends BaseConfig implements ModelSettingUtil {
  async getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): Promise<string> {
    return `Gemini API (${settings.geminiModel})`
  }

  getCurrentModelOptionValue(settings: Settings) {
    return settings.geminiModel
  }

  public getLocalOptionGroups(settings: ModelSettings) {
    return [
      {
        options: geminiModels.map((value) => {
          return {
            label: value,
            value: value,
          }
        }),
      },
    ]
  }

  protected async listProviderModels(settings: ModelSettings) {
    const gemini = new Gemini(settings)
    return gemini.listModels()
  }

  selectSessionModel(settings: Session['settings'], selected: string): Session['settings'] {
    return {
      ...settings,
      geminiModel: selected as GeminiModel,
    }
  }

  isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
    return true
  }

  isCurrentModelSupportWebBrowsing(settings: ModelSettings): boolean {
    return settings.geminiModel === 'gemini-2.0-flash-exp' || settings.geminiModel.includes('gemini-2.0')
  }
}
