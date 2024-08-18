import { ModelSettings, Session, SessionType, Settings } from "src/shared/types";
import { ModelSettingUtil } from "./interface";
import * as settingActions from "../../stores/settingActions"

export default class CustomModelSettingUtil implements ModelSettingUtil {
    getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): string {
        const customProvider = settings.customProviders?.find((provider) => provider.id === settings.selectedCustomProviderId)
        if (!customProvider) {
            return 'unknown'
        }
        return `${customProvider.name}(${customProvider.model})`
    }

    getCurrentModelOption(settings: Settings) {
        const customProvider = settings.customProviders?.find((provider) => provider.id === settings.selectedCustomProviderId)
        if (!customProvider) {
            return {
                label: 'unknown',
                value: 'unknown',
            }
        }
        return {
            label: customProvider.model,
            value: customProvider.model,
        }
    }

    async listModelOptions(settings: Settings) {
        const customProvider = settings.customProviders?.find((provider) => provider.id === settings.selectedCustomProviderId)
        if (!customProvider) {
            return []
        }
        const models = customProvider.modelOptions || []
        if (!models.includes(customProvider.model)) {
            models.push(customProvider.model)
        }
        return models.map((model) => ({ label: model, value: model }))
    }

    selectSessionModel(settings: Session["settings"], selected: string): Session["settings"] {
        const globalSettings = settingActions.getSettings()
        const selectedCustomProviderId = settings?.selectedCustomProviderId || globalSettings.selectedCustomProviderId
        const customProviders = globalSettings.customProviders.map((provider) => {
            if (provider.id === selectedCustomProviderId) {
                return { ...provider, model: selected }
            }
            return provider
        })
        return {
            ...settings,
            customProviders,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return true
    }
}