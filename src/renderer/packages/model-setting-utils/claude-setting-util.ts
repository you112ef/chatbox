import { ModelSettings, Session, SessionType, Settings } from 'src/shared/types'
import { ModelSettingUtil } from './interface'
import { ClaudeModel, claudeModels } from '../models/claude'
import BaseConfig from './base-config'

export default class ClaudeSettingUtil extends BaseConfig implements ModelSettingUtil {
    async getCurrentModelDisplayName(settings: Settings, sessionType: SessionType) {
        return settings.claudeModel || 'unknown'
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

    selectSessionModel(settings: Session['settings'], selected: string): Session['settings'] {
        return {
            ...settings,
            claudeModel: selected as ClaudeModel,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return settings.claudeModel.startsWith('claude-3')
    }
}
