import { ModelSettings, Session, SessionType, Settings } from "src/shared/types"

export interface ModelSettingUtil {
    getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): string
    getCurrentModelOption(settings: Settings): { label: string, value: string }
    listModelOptions(settings: Settings): Promise<{ label: string, value: string }[]>
    selectSessionModel(settings: Session['settings'], selected: string): Session['settings']
    isCurrentModelSupportImageInput(settings: ModelSettings): boolean
}
