import { ModelSettings, Session, SessionType, Settings } from "src/shared/types";
import { ModelSettingUtil } from "./interface";
import BaseConfig from './base-config'

export default class ChatGLMSettingUtil extends BaseConfig implements ModelSettingUtil {
    getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): string {
        return 'ChatGLM'
    }

    getCurrentModelOptionValue(settings: Settings) {
        return 'ChatGLM'
    }

    getLocalOptionGroups(settings: Settings) {
        return [
            {
                options: [
                    {
                        label: 'ChatGLM',
                        value: 'ChatGLM',
                    }
                ]
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
