import { ModelSettings, Session, SessionType, Settings } from "src/shared/types";
import { ModelSettingUtil } from "./interface";
import OpenAI, { OpenAIModel, openaiModelConfigs } from "../models/openai";
import { uniq } from "lodash";
import BaseConfig from "./base-config";

export default class OpenAISettingUtil extends BaseConfig implements ModelSettingUtil {
    getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): string {
        if (sessionType === 'picture') {
            return `OpenAI (DALL-E-3)`
        } else {
            if (settings.model === 'custom-model') {
                let name = settings.openaiCustomModel || ''
                if (name.length >= 10) {
                    name = name.slice(0, 10) + '...'
                }
                return `OpenAI Custom Model (${name})`
            }
            return settings.model || 'unknown'
        }
    }

    getCurrentModelOptionValue(settings: Settings) {
        let current: string = settings.model
        if (settings.model === 'custom-model') {
            current = settings.openaiCustomModel || ''
        }
        return current
    }

    getLocalOptionGroups(settings: Settings) {
        let models = Array.from(Object.keys(openaiModelConfigs)).sort()
        if (settings.openaiCustomModel) {
            models.push(settings.openaiCustomModel)
        }
        models.push(...settings.openaiCustomModelOptions)
        models = uniq(models)
        return [
            {
                options: models.map(value => ({
                    label: value,
                    value: value,
                }))
            }
        ]
    }

    selectSessionModel(settings: Session["settings"], selected: string): Session["settings"] {
        const nativeModels = Array.from(Object.keys(openaiModelConfigs))
        if (!nativeModels.includes(selected)) {
            return {
                ...settings,
                model: 'custom-model',
                openaiCustomModel: selected,
            }
        } else {
            return {
                ...settings,
                model: selected as OpenAIModel,
            }
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return OpenAI.isSupportVision(settings.model)
    }

}
