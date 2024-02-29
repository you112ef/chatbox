import { Config, Language, Settings } from "src/shared/types"

export type PlatformType = 'web' | 'desktop'

export interface Platform {
    type: PlatformType

    // 系统相关

    getVersion(): Promise<string>
    getPlatform(): Promise<string>
    shouldUseDarkColors(): Promise<boolean>
    onSystemThemeChange(callback: () => void): () => void
    onWindowShow(callback: () => void): () => void
    openLink(url: string): Promise<void>
    getInstanceName(): Promise<string>
    getLocale(): Promise<Language>
    ensureShortcutConfig(config: { disableQuickToggleShortcut: boolean }): Promise<void>
    ensureProxyConfig(config: { proxy?: string }): Promise<void>
    relaunch(): Promise<void>

    // 数据配置

    getConfig(): Promise<Config>
    getSettings(): Promise<Settings>

    setStoreValue(key: string, value: any): Promise<void>
    getStoreValue(key: string): Promise<any>
    delStoreValue(key: string): Promise<void>
    getAllStoreValues(): Promise<{ [key: string]: any }>
    setAllStoreValues(data: { [key: string]: any }): Promise<void>

    // Blob 存储

    getStoreBlob(key: string): Promise<string | null>
    setStoreBlob(key: string, value: string): Promise<void>
    delStoreBlob(key: string): Promise<void>
    listStoreBlobKeys(): Promise<string[]>

    // 追踪

    initTracking(): void
    trackingEvent(name: string, params: { [key: string]: string }): void
}
