import { ChatboxAIModel, ModelSettings, Session, SessionType, Settings } from 'src/shared/types'
import { ModelSettingUtil } from './interface'
import { chatboxAIModels } from '../models/chatboxai'
import BaseConfig from './base-config'
import { ModelOptionGroup } from 'src/shared/types'

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
        let models = chatboxAIModels
        if (settings.language === 'zh-Hans' || settings.language === 'zh-Hant') {
            models = [ ...chatboxAIModels, 'deepseek-chat', 'deepseek-reasoner' ]
        }
        return [
            {
                options: models.map((value) => ({
                    label: this.formatModelLabel(value),
                    value: value,
                })),
            },
        ]
    }

    formatModelLabel(value: string): string {
        if (value === 'deepseek-chat') {
            return 'DeepSeek V3'
        } else if (value === 'deepseek-reasoner') {
            return 'DeepSeek R1'
        }
        return value.replace('chatboxai-', 'Chatbox AI ')
    }

    mergeOptionGroups(localOptionGroups: ModelOptionGroup[], remoteOptionGroups: ModelOptionGroup[]) {
        const ret = [...remoteOptionGroups, ...localOptionGroups ]
        const existedOptionSet = new Set<string>()
        for (const group of ret) {
            group.options = group.options.filter((option) => {
                const existed = existedOptionSet.has(option.value)
                existedOptionSet.add(option.value)
                return !existed
            })
        }
        return ret.filter((group) => group.options.length > 0)
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

    isCurrentModelSupportWebBrowsing(settings: ModelSettings): boolean {
        return true
    }
}
