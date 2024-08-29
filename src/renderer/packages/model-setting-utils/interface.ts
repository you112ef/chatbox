import { ModelSettings, Session, SessionType, Settings, ModelOptionGroup } from "src/shared/types"

export interface ModelSettingUtil {
    getCurrentModelDisplayName(settings: Settings, sessionType: SessionType): Promise<string>

    getCurrentModelOptionValue(settings: Settings): string
    getCurrentModelOptionLabel(settings: Settings): Promise<string>

    getLocalOptionGroups(settings: Settings): ModelOptionGroup[]
    getRemoteOptionGroups(settings: Settings): Promise<ModelOptionGroup[]>
    getMergeOptionGroups(settings: Settings): Promise<ModelOptionGroup[]>

    selectSessionModel(settings: Session['settings'], selected: string): Session['settings']
    isCurrentModelSupportImageInput(settings: ModelSettings): boolean
}
