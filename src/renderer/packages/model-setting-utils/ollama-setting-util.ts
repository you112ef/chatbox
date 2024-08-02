import { ModelSettings, Session, SessionType, Settings } from "src/shared/types";
import { ModelSettingUtil } from "./interface";
import Ollama from "../models/ollama";

export default class OllamaSettingUtil implements ModelSettingUtil {
    getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): string {
        return `Ollama (${settings.ollamaModel})`
    }

    getCurrentModelOption(settings: Settings) {
        return {
            label: settings.ollamaModel,
            value: settings.ollamaModel,
        }
    }

    async listModelOptions(settings: Settings) {
        const ollama = new Ollama(settings)
        const models = await ollama.listModels()
        return models.map(model => ({
            label: model,
            value: model,
        }))
    }

    selectSessionModel(settings: Session["settings"], selected: string): Session["settings"] {
        return {
            ...settings,
            ollamaModel: selected,
        }
    }

    isCurrentModelSupportImageInput(settings: ModelSettings): boolean {
        return false
    }
}
