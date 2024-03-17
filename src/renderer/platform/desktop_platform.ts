import { ElectronIPC } from "src/shared/electron-types"
import { Platform, PlatformType } from "./interfaces"
import { Config, Settings } from "src/shared/types"
import { getOS, getBrowser } from '../packages/navigator'
import { parseLocale } from '@/i18n/parser'
import WebExporter from "./web_exporter"

export default class DesktopPlatform implements Platform {
    public type: PlatformType = 'desktop'

    public exporter = new WebExporter()

    public ipc: ElectronIPC
    constructor(ipc: ElectronIPC) {
        this.ipc = ipc
    }

    public async getVersion() {
        return this.ipc.invoke('getVersion')
    }
    public async getPlatform() {
        return this.ipc.invoke('getPlatform')
    }
    public async shouldUseDarkColors(): Promise<boolean> {
        return await this.ipc.invoke('shouldUseDarkColors')
    }
    public onSystemThemeChange(callback: () => void): () => void {
        return this.ipc.onSystemThemeChange(callback)
    }
    public onWindowShow(callback: () => void): () => void {
        return this.ipc.onWindowShow(callback)
    }
    public async openLink(url: string): Promise<void> {
        return this.ipc.invoke('openLink', url)
    }
    public async getInstanceName(): Promise<string> {
        const hostname = await this.ipc.invoke('getHostname')
        return `${hostname} / ${getOS()}`
    }
    public async getLocale() {
        const locale = await this.ipc.invoke('getLocale')
        return parseLocale(locale)
    }
    public async ensureShortcutConfig(config: { disableQuickToggleShortcut: boolean }): Promise<void> {
        return this.ipc.invoke('ensureShortcutConfig', JSON.stringify(config))
    }
    public async ensureProxyConfig(config: { proxy?: string }): Promise<void> {
        return this.ipc.invoke('ensureProxy', JSON.stringify(config))
    }
    public async relaunch(): Promise<void> {
        return this.ipc.invoke('relaunch')
    }

    public async getConfig(): Promise<Config> {
        return this.ipc.invoke('getConfig')
    }
    public async getSettings(): Promise<Settings> {
        return this.ipc.invoke('getSettings')
    }

    public async setStoreValue(key: string, value: any) {
        // 为什么要序列化？
        // 为了实现进程通信，electron invoke 会自动对传输数据进行序列化，
        // 但如果数据包含无法被序列化的类型（比如 message 中常带有的 cancel 函数）将直接报错：
        // Uncaught (in promise) Error: An object could not be cloned.
        // 因此对于数据类型不容易控制的场景，应该提前 JSON.stringify，这种序列化方式会自动处理异常类型。
        const valueJson = JSON.stringify(value)
        return this.ipc.invoke('setStoreValue', key, valueJson)
    }
    public async getStoreValue(key: string) {
        return this.ipc.invoke('getStoreValue', key)
    }
    public delStoreValue(key: string) {
        return this.ipc.invoke('delStoreValue', key)
    }
    public async getAllStoreValues(): Promise<{ [key: string]: any }> {
        const json = await this.ipc.invoke('getAllStoreValues')
        return JSON.parse(json)
    }
    public async setAllStoreValues(data: { [key: string]: any }) {
        await this.ipc.invoke('setAllStoreValues', JSON.stringify(data))
    }

    public async getStoreBlob(key: string): Promise<string | null> {
        return this.ipc.invoke('getStoreBlob', key)
    }
    public async setStoreBlob(key: string, value: string) {
        return this.ipc.invoke('setStoreBlob', key, value)
    }
    public async delStoreBlob(key: string) {
        return this.ipc.invoke('delStoreBlob', key)
    }
    public async listStoreBlobKeys(): Promise<string[]> {
        return this.ipc.invoke('listStoreBlobKeys')
    }

    public initTracking(): void {
        this.trackingEvent('user_engagement', {})
    }
    public trackingEvent(name: string, params: { [key: string]: string }) {
        const dataJson = JSON.stringify({ name, params })
        this.ipc.invoke('analysticTrackingEvent', dataJson)
    }
}
