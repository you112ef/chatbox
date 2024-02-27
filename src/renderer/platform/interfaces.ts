import { Config } from "src/shared/types"

export type PlatformType = 'web' | 'desktop'

export interface Platform {
    type: PlatformType

    getVersion(): Promise<string>
    getPlatform(): Promise<string>

    getConfig(): Promise<Config>

    initTracking(): void
    trackingEvent(name: string, params: { [key: string]: string }): void
}
