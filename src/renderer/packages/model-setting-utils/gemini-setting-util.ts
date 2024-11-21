import { ModelSettings, Session, SessionType, Settings } from 'src/shared/types'
import { ModelSettingUtil } from './interface'
import Gemini, { GeminiModel, geminiModels } from '../models/gemini'
import BaseConfig from './base-config'

export default class GeminiSettingUtil extends BaseConfig implements ModelSettingUtil {
    async getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): Promise<string> {
        return `Google (${settings.geminiModel})`
    }

    getCurrentModelOptionValue(settings: Settings) {
        return settings.geminiModel
    }

    getLocalOptionGroups(settings: Settings) {
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

    async getRemoteOptionGroups(settings: Settings) {
        const remoteModels = await super.getRemoteOptionGroups(settings).catch(() => [])
        const gemini = new Gemini(settings)
        const geminiAPIModels = await gemini.listModels().catch(() => [])
        return [
            ...remoteModels,
            {
                options: geminiAPIModels.map((model) => {
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
            geminiModel: selected as GeminiModel,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return true
    }
}
