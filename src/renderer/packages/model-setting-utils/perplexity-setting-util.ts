import { ModelSettings, Session, SessionType, Settings } from 'src/shared/types'
import { ModelSettingUtil } from './interface'
import BaseConfig from './base-config'
import Perplexity from '../models/perplexity'

export default class PerplexitySettingUtil extends BaseConfig implements ModelSettingUtil {
  async getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): Promise<string> {
    return `Perplexity API (${settings.perplexityModel})`
  }

  getCurrentModelOptionValue(settings: Settings) {
    return settings.perplexityModel
  }

  public getLocalOptionGroups(settings: ModelSettings) {
    return []
  }

  protected async listProviderModels(settings: ModelSettings) {
    const perplexity = new Perplexity(settings)
    return perplexity.listModels()
  }

  selectSessionModel(settings: Session['settings'], selected: string): Session['settings'] {
    return {
      ...settings,
      perplexityModel: selected,
    }
  }

  isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
    return Perplexity.helpers.isModelSupportVision(settings.perplexityModel)
  }

  isCurrentModelSupportToolUse(settings: ModelSettings): boolean {
    return Perplexity.helpers.isModelSupportToolUse(settings.perplexityModel)
  }
}
