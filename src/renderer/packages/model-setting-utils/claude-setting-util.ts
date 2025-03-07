import { ModelOptionGroup, ModelSettings, Session, SessionType, Settings } from 'src/shared/types'
import { ModelSettingUtil } from './interface'
import { claudeModels } from '../models/claude'
import BaseConfig from './base-config'
import Claude from '../models/claude'

export default class ClaudeSettingUtil extends BaseConfig implements ModelSettingUtil {
  async getCurrentModelDisplayName(settings: Settings, sessionType: SessionType) {
    return `Claude API (${settings.claudeModel || 'unknown'})`
  }

  getCurrentModelOptionValue(settings: Settings): string {
    return settings.claudeModel
  }

  getLocalOptionGroups(settings: Settings) {
    return [
      {
        options: claudeModels.map((value) => ({
          label: value,
          value: value,
        })),
      },
    ]
  }

  async getRemoteOptionGroups(settings: Settings) {
    const remoteModels = await super.getRemoteOptionGroups(settings).catch(() => [])
    const claude = new Claude(settings)
    const claudeAPIModels = await claude.listModels().catch(() => [])
    return [
      ...remoteModels,
      {
        options: claudeAPIModels.map((model) => {
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
      claudeModel: selected,
    }
  }

  isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
    return settings.claudeModel.startsWith('claude-3')
  }

  isCurrentModelSupportToolUse(settings: ModelSettings): boolean {
    return true
  }
}
