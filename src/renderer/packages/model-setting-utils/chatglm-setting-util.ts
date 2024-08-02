import { ModelSettings, Session, SessionType, Settings } from "src/shared/types";
import { ModelSettingUtil } from "./interface";

export default class ChatGLMSettingUtil implements ModelSettingUtil {
    getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): string {
        return 'ChatGLM'
    }

    getCurrentModelOption(settings: Settings) {
        return {
            label: 'ChatGLM',
            value: 'ChatGLM',
        }
    }

    async listModelOptions(settings: Settings) {
        return [
            {
                label: 'ChatGLM',
                value: 'ChatGLM',
            }
        ]
    }

    selectSessionModel(settings: Session["settings"], selected: string): Session["settings"] {
        return settings
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return false
    }
}
