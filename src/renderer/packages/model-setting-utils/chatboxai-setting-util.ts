import { ChatboxAIModel, ModelSettings, Session, SessionType, Settings } from "src/shared/types";
import { ModelSettingUtil } from "./interface";
import { chatboxAIModels } from "../models/chatboxai";
import BaseConfig from "./base-config";

export default class ChatboxAISettingUtil extends BaseConfig implements ModelSettingUtil {
    getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): string {
        if (sessionType === 'picture') {
            return `Chatbox AI (DALL-E-3)`
        } else {
            const model = settings.chatboxAIModel || 'chatboxai-3.5'
            return model.replace('chatboxai-', 'Chatbox AI ')
        }
    }

    getCurrentModelOptionValue(settings: Settings) {
        return settings.chatboxAIModel || 'chatboxai-3.5'
    }

    getLocalOptionGroups(settings: Settings) {
        return [
            {
                options: chatboxAIModels.map(value => ({
                    label: this.formatModelLabel(value),
                    value: value,
                }))
            }
        ]
    }

    formatModelLabel(value: string): string {
        return value.replace('chatboxai-', 'Chatbox AI ')
    }

    selectSessionModel(settings: Session["settings"], selected: string): Session["settings"] {
        return {
            ...settings,
            chatboxAIModel: selected as ChatboxAIModel,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return true
    }
}
