import { ModelSettings, Session, SessionType, Settings } from 'src/shared/types'
import { ModelSettingUtil } from './interface'
import BaseConfig from './base-config'
import XAI from '../models/xai'

export default class XAISettingUtil extends BaseConfig implements ModelSettingUtil {
    async getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): Promise<string> {
        return `xAI (${settings.xAIModel})`
    }

    getCurrentModelOptionValue(settings: Settings) {
        return settings.xAIModel
    }

    getLocalOptionGroups(settings: Settings) {
        return []
    }

    async getRemoteOptionGroups(settings: Settings) {
        const remoteModels = await super.getRemoteOptionGroups(settings).catch(() => [])
        const xai = new XAI(settings)
        const xaiAPIModels = await xai.listModels().catch(() => [])
        return [
            ...remoteModels,
            {
                options: xaiAPIModels.map((model) => {
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
            xAIModel: selected,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return true
    }

    isCurrentModelSupportWebBrowsing(settings: ModelSettings): boolean {
        return false
    }
}
