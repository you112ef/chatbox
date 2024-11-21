import { ModelSettings, Session, SessionType, Settings } from 'src/shared/types'
import { ModelSettingUtil } from './interface'
import Ollama from '../models/ollama'
import BaseConfig from './base-config'

export default class OllamaSettingUtil extends BaseConfig implements ModelSettingUtil {
    async getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): Promise<string> {
        return `Ollama (${settings.ollamaModel})`
    }

    getCurrentModelOptionValue(settings: Settings) {
        return settings.ollamaModel
    }

    async getRemoteOptionGroups(settings: Settings) {
        const ollama = new Ollama(settings)
        const models = await ollama.listModels()
        return [
            {
                options: models.map((model) => {
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
            ollamaModel: selected,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return true
    }
}
