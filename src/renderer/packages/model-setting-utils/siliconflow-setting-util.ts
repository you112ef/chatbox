import { ModelSettings, Session, SessionType, Settings } from 'src/shared/types'
import { ModelSettingUtil } from './interface'
import BaseConfig from './base-config'
import SiliconFlow, { siliconFlowModels, modelMeta } from '../models/siliconflow'

export default class SiliconFlowSettingUtil extends BaseConfig implements ModelSettingUtil {
  async getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): Promise<string> {
    return `SiliconFlow API (${settings.siliconCloudModel})`
  }

  getCurrentModelOptionValue(settings: Settings) {
    return settings.siliconCloudModel
  }

  public getLocalOptionGroups(settings: ModelSettings) {
    return [
      {
        options: siliconFlowModels.map((value) => {
          return {
            label: value,
            value: value,
          }
        }),
      },
    ]
  }

  protected async listProviderModels(settings: ModelSettings) {
    const siliconFlow = new SiliconFlow(settings)
    return siliconFlow.listModels()
  }

  selectSessionModel(settings: Session['settings'], selected: string): Session['settings'] {
    return {
      ...settings,
      siliconCloudModel: selected,
    }
  }

  isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
    const siliconFlow = new SiliconFlow(settings)
    return siliconFlow.isSupportVision(settings.siliconCloudModel)
  }

  isCurrentModelSupportWebBrowsing(settings: ModelSettings): boolean {
    return false
  }
}
