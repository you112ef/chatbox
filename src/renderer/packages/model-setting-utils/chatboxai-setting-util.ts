import { ChatboxAIModel, ModelSettings, Session, SessionType, Settings } from "src/shared/types";
import { ModelSettingUtil } from "./interface";
import { chatboxAIModels } from "../models/chatboxai";

export default class ChatboxAISettingUtil implements ModelSettingUtil {
    getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): string {
        if (sessionType === 'picture') {
            return `Chatbox AI (DALL-E-3)`
        } else {
            const model = settings.chatboxAIModel || 'chatboxai-3.5'
            return model.replace('chatboxai-', 'Chatbox AI ')
        }
    }

    getCurrentModelOption(settings: Settings) {
        const value = settings.chatboxAIModel || 'chatboxai-3.5'
        return {
            label: this.formatModelLabel(value),
            value: value,
        }
    }

    async listModelOptions(settings: Settings) {
        return chatboxAIModels.map(value => {
            return {
                label: this.formatModelLabel(value),
                value: value,
            }
        })
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
