import { ModelSettings, Session, SessionType, Settings } from "src/shared/types";
import { ModelSettingUtil } from "./interface";
import { ClaudeModel, claudeModels } from "../models/claude";

export default class ClaudeSettingUtil implements ModelSettingUtil {
    getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): string {
        return settings.claudeModel || 'unknown'
    }

    getCurrentModelOption(settings: Settings) {
        return {
            label: settings.claudeModel,
            value: settings.claudeModel,
        }
    }

    async listModelOptions(settings: Settings) {
        return claudeModels.map(value => {
            return {
                label: value,
                value: value,
            }
        })
    }

    selectSessionModel(settings: Session["settings"], selected: string): Session["settings"] {
        return {
            ...settings,
            claudeModel: selected as ClaudeModel,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return settings.claudeModel.startsWith('claude-3')
    }
}
