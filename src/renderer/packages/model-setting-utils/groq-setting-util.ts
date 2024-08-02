import { ModelSettings, Session, SessionType, Settings } from "src/shared/types";
import { ModelSettingUtil } from "./interface";
import { GroqModel, groqModels } from "../models/groq";

export default class GroqSettingUtil implements ModelSettingUtil {
    getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): string {
        return `Groq (${settings.groqModel})`
    }

    getCurrentModelOption(settings: Settings) {
        return {
            label: settings.groqModel,
            value: settings.groqModel,
        }
    }

    async listModelOptions(settings: Settings) {
        return groqModels.map(value => {
            return {
                label: value,
                value: value,
            }
        })
    }

    selectSessionModel(settings: Session["settings"], selected: string): Session["settings"] {
        return {
            ...settings,
            groqModel: selected as GroqModel,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return false
    }
}