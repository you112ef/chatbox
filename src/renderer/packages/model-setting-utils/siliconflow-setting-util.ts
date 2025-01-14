import { ModelSettings, Session, SessionType, Settings } from 'src/shared/types'
import { ModelSettingUtil } from './interface'
import BaseConfig from './base-config'
import SiliconFlow, { siliconFlowModels } from '../models/siliconflow'

export default class SiliconFlowSettingUtil extends BaseConfig implements ModelSettingUtil {
    async getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): Promise<string> {
        return `SiliconFlow (${settings.siliconCloudModel})`
    }

    getCurrentModelOptionValue(settings: Settings) {
        return settings.siliconCloudModel
    }

    getLocalOptionGroups(settings: Settings) {
        return [
            {
                options: siliconFlowModels.map((value) => {
                    return {
                        label: value,
                        value: value,
                    }
                }),
            },
        ]
    }

    async getRemoteOptionGroups(settings: Settings) {
        const remoteModels = await super.getRemoteOptionGroups(settings).catch(() => [])
        const siliconFlow = new SiliconFlow(settings)
        const siliconFlowAPIModels = await siliconFlow.listRemoteModels().catch(() => [])
        return [
            ...remoteModels,
            {
                options: siliconFlowAPIModels.map((model) => {
                    return {
                        label: model,
                        value: model,
                    }
                }),
            },
        ]
    }

    selectSessionModel(settings: Session['settings'], selected: string): Session['settings'] {
        return {
            ...settings,
            siliconCloudModel: selected,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        const siliconFlow = new SiliconFlow(settings)
        return siliconFlow.isSupportVision(settings.siliconCloudModel)
    }

    isCurrentModelSupportWebBrowsing(settings: ModelSettings): boolean {
        return false
    }
}
