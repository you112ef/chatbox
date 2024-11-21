import { ChatboxAIModel, ModelSettings, Session, SessionType, Settings } from 'src/shared/types'
import { ModelSettingUtil } from './interface'
import { chatboxAIModels } from '../models/chatboxai'
import BaseConfig from './base-config'

export default class ChatboxAISettingUtil extends BaseConfig implements ModelSettingUtil {
    async getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): Promise<string> {
        if (sessionType === 'picture') {
            return `Chatbox AI (DALL-E-3)`
        } else {
            // const model = settings.chatboxAIModel || 'chatboxai-3.5'
            let model = await this.getCurrentModelOptionLabel(settings)
            if (!model.toLowerCase().includes('chatbox')) {
                model = `Chatbox AI (${model})`
            }
            model = model.replace('chatboxai-', 'Chatbox AI ')
            return model
        }
    }

    getCurrentModelOptionValue(settings: Settings) {
        return settings.chatboxAIModel || 'chatboxai-3.5'
    }

    getLocalOptionGroups(settings: Settings) {
        return [
            {
                options: chatboxAIModels.map((value) => ({
                    label: this.formatModelLabel(value),
                    value: value,
                })),
            },
        ]
    }

    formatModelLabel(value: string): string {
        return value.replace('chatboxai-', 'Chatbox AI ')
    }

    selectSessionModel(settings: Session['settings'], selected: string): Session['settings'] {
        return {
            ...settings,
            chatboxAIModel: selected as ChatboxAIModel,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return true
    }
}
