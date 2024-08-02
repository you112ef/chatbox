import { ModelSettings, Session, SessionType, Settings } from "src/shared/types";
import { ModelSettingUtil } from "./interface";
import Gemini, { GeminiModel, geminiModels } from "../models/gemini";

export default class GeminiSettingUtil implements ModelSettingUtil {
    getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): string {
        return `Google (${settings.geminiModel})`
    }

    getCurrentModelOption(settings: Settings) {
        return {
            label: settings.geminiModel,
            value: settings.geminiModel,
        }
    }

    async listModelOptions(settings: Settings) {
        return geminiModels.map(value => {
            return {
                label: value,
                value: value,
            }
        })
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