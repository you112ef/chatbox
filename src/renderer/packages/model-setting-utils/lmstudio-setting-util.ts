import { ModelSettings, Session, SessionType, Settings } from 'src/shared/types'
import { ModelSettingUtil } from './interface'
import BaseConfig from './base-config'
import LMStudio from '../models/lmstudio'

export default class LMStudioSettingUtil extends BaseConfig implements ModelSettingUtil {
  async getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): Promise<string> {
    return `LM Studio (${settings.lmStudioModel})`
  }

  getCurrentModelOptionValue(settings: Settings) {
    return settings.lmStudioModel
  }

  getLocalOptionGroups(settings: Settings) {
    return []
  }

  async getRemoteOptionGroups(settings: Settings) {
    const remoteModels = await super.getRemoteOptionGroups(settings).catch(() => [])
    const lmStudio = new LMStudio(settings)
    const lmStudioAPIModels = await lmStudio.listRemoteModels().catch(() => [])
    return [
      ...remoteModels,
      {
        options: lmStudioAPIModels.map((model) => {
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
      lmStudioModel: selected,
    }
  }

  isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
    const lmStudio = new LMStudio(settings)
    return lmStudio.isSupportVision(settings.lmStudioModel)
  }

  isCurrentModelSupportWebBrowsing(settings: ModelSettings): boolean {
    return false
  }
}
