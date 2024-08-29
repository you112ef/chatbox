import { ModelSettings, Session, SessionType, Settings } from "src/shared/types";
import { ModelSettingUtil } from "./interface";
import Gemini, { GeminiModel, geminiModels } from "../models/gemini";
import BaseConfig from "./base-config";

export default class GeminiSettingUtil extends BaseConfig implements ModelSettingUtil {
    getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): string {
        return `Google (${settings.geminiModel})`
    }

    getCurrentModelOptionValue(settings: Settings) {
        return settings.geminiModel
    }

    getLocalOptionGroups(settings: Settings) {
        return [
            {
                options: geminiModels.map(value => {
                    return {
                        label: value,
                        value: value,
                    }
                })
            }
        ]
    }

    selectSessionModel(settings: Session["settings"], selected: string): Session["settings"] {
        return {
            ...settings,
            geminiModel: selected as GeminiModel,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return Gemini.isSupportVision(settings.geminiModel)
    }

}