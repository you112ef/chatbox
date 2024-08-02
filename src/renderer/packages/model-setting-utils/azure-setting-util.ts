import { ModelSettings, Session, SessionType, Settings } from "src/shared/types";
import { ModelSettingUtil } from "./interface";
import AzureOpenAI from "../models/azure";

export default class AzureSettingUtil implements ModelSettingUtil {
    getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): string {
        if (sessionType === 'picture') {
            return `Azure OpenAI (${settings.azureDalleDeploymentName})`
        } else {
            return `Azure OpenAI (${settings.azureDeploymentName})`
        }
    }

    getCurrentModelOption(settings: Settings) {
        return {
            label: settings.azureDeploymentName,
            value: settings.azureDeploymentName,
        }
    }

    async listModelOptions(settings: Settings) {
        return [
            {
                label: settings.azureDeploymentName,
                value: settings.azureDeploymentName,
            }
        ]
    }

    selectSessionModel(settings: Session["settings"], selected: string): Session["settings"] {
        return {
            ...settings,
            azureDeploymentName: selected,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return AzureOpenAI.isSupportVision(settings.azureDeploymentName)
    }
}
