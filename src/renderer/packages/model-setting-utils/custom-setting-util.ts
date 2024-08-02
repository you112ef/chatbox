import { ModelSettings, Session, SessionType, Settings } from "src/shared/types";
import { ModelSettingUtil } from "./interface";

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
        return [
            {
                label: customProvider.model,
                value: customProvider.model,
            }
        ]
    }

    selectSessionModel(settings: Session["settings"], selected: string): Session["settings"] {
        return settings
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return true
    }
}