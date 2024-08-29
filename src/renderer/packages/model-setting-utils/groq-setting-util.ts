import { ModelSettings, Session, SessionType, Settings } from "src/shared/types";
import { ModelSettingUtil } from "./interface";
import { GroqModel, groqModels } from "../models/groq";
import BaseConfig from "./base-config";

export default class GroqSettingUtil extends BaseConfig implements ModelSettingUtil {
    async getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): Promise<string> {
        return `Groq (${settings.groqModel})`
    }

    getCurrentModelOptionValue(settings: Settings) {
        return settings.groqModel
    }

    getLocalOptionGroups(settings: Settings) {
        return [
            {
                options: groqModels.map(value => {
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
            groqModel: selected as GroqModel,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return false
    }
}