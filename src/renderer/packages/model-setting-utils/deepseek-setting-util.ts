import { ModelSettings, Session, SessionType, Settings } from 'src/shared/types'
import { ModelSettingUtil } from './interface'
import BaseConfig from './base-config'
import DeepSeek, { deepSeekModels } from '../models/deepseek'

export default class DeepSeekSettingUtil extends BaseConfig implements ModelSettingUtil {
    async getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): Promise<string> {
        return `DeepSeek (${settings.deepseekModel})`
    }

    getCurrentModelOptionValue(settings: Settings) {
        return settings.deepseekModel
    }

    getLocalOptionGroups(settings: Settings) {
        return [
            {
                options: deepSeekModels.map((value) => {
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
        const deepSeek = new DeepSeek(settings)
        const deepSeekAPIModels = await deepSeek.listModels().catch(() => [])
        return [
            ...remoteModels,
            {
                options: deepSeekAPIModels.map((model) => {
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
            deepseekModel: selected,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        const deepSeek = new DeepSeek(settings)
        return deepSeek.isSupportVision(settings.deepseekModel)
    }

    isCurrentModelSupportWebBrowsing(settings: ModelSettings): boolean {
        return false
    }
}
