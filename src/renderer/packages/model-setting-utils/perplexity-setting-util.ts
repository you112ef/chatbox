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

    getLocalOptionGroups(settings: Settings) {
        return []
    }

    async getRemoteOptionGroups(settings: Settings) {
        const remoteModels = await super.getRemoteOptionGroups(settings).catch(() => [])
        const perplexity = new Perplexity(settings)
        const perplexityAPIModels = await perplexity.listModels().catch(() => [])
        return [
            ...remoteModels,
            {
                options: perplexityAPIModels.map((model) => {
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
            perplexityModel: selected,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        const perplexity = new Perplexity(settings)
        return perplexity.isSupportVision(settings.perplexityModel)
    }

    isCurrentModelSupportWebBrowsing(settings: ModelSettings): boolean {
        return true
    }
}
