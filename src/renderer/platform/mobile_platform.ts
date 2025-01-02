import { Config, Settings, ShortcutSetting } from 'src/shared/types'
import * as defaults from 'src/shared/defaults'
import { Platform, PlatformType } from './interfaces'
import store from 'store'
import { getOS, getBrowser } from '../packages/navigator'
import { parseLocale } from '@/i18n/parser'
import localforage from 'localforage'
import MobileExporter from './mobile_exporter'

export default class MobilePlatform implements Platform {
    public type: PlatformType = 'mobile'

    public exporter = new MobileExporter()

    constructor() {}

    public async getVersion(): Promise<string> {
        return ''
    }
    public async getPlatform(): Promise<string> {
        return 'web'
    }
    public async shouldUseDarkColors(): Promise<boolean> {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    public onSystemThemeChange(callback: () => void): () => void {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', callback)
        return () => {
            window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', callback)
        }
    }
    public onWindowShow(callback: () => void): () => void {
        return () => null
    }
    public async openLink(url: string): Promise<void> {
        window.open(url)
    }
    public async getInstanceName(): Promise<string> {
        return `${getOS()} / ${getBrowser()}`
    }
    public async getLocale() {
        const lang = window.navigator.language
        return parseLocale(lang)
    }
    public async ensureShortcutConfig(config: ShortcutSetting): Promise<void> {
        return
    }
    public async ensureProxyConfig(config: { proxy?: string }): Promise<void> {
        return
    }
    public async relaunch(): Promise<void> {
        location.reload()
    }

    public async getConfig(): Promise<Config> {
        let value = store.get('configs')
        if (value === undefined || value === null) {
            value = defaults.newConfigs()
            store.set('configs', value)
        }
        return value
    }
    public async getSettings(): Promise<Settings> {
        let value = store.get('settings')
        if (value === undefined || value === null) {
            value = defaults.settings()
            store.set('settings', value)
        }
        return value
    }

    public async setStoreValue(key: string, value: any) {
        return store.set(key, value)
    }
    public async getStoreValue(key: string) {
        return store.get(key)
    }
    public async delStoreValue(key: string) {
        return store.remove(key)
    }
    public async getAllStoreValues(): Promise<{ [key: string]: any }> {
        const ret: { [key: string]: any } = {}
        store.each((value, key) => {
            ret[key] = value
        })
        return ret
    }
    public async setAllStoreValues(data: { [key: string]: any }): Promise<void> {
        for (const [key, value] of Object.entries(data)) {
            store.set(key, value)
        }
    }

    public async getStoreBlob(key: string): Promise<string | null> {
        return localforage.getItem<string>(key)
    }
    public async setStoreBlob(key: string, value: string): Promise<void> {
        await localforage.setItem(key, value)
    }
    public async delStoreBlob(key: string) {
        return localforage.removeItem(key)
    }
    public async listStoreBlobKeys(): Promise<string[]> {
        return localforage.keys()
    }

    public async initTracking() {
        const GAID = 'G-B365F44W6E'
        try {
            const conf = await this.getConfig()
            window.gtag('config', GAID, {
                app_name: 'chatbox',
                user_id: conf.uuid,
                client_id: conf.uuid,
                app_version: await this.getVersion(),
                chatbox_platform_type: 'web',
                chatbox_platform: await this.getPlatform(),
                app_platform: await this.getPlatform(),
            })
        } catch (e) {
            window.gtag('config', GAID, {
                app_name: 'chatbox',
            })
            throw e
        }
    }
    public trackingEvent(name: string, params: { [key: string]: string }) {
        window.gtag('event', name, params)
    }

    public async shouldShowAboutDialogWhenStartUp(): Promise<boolean> {
        return false
    }

    public async appLog(level: string, message: string): Promise<void> {
        console.log(`APP_LOG: [${level}] ${message}`)
    }

    public async ensureAutoLaunch(enable: boolean) {
        return
    }

    public async parseFile(filePath: string): Promise<string> {
        throw new Error('Not implemented')
    }
    public async parseUrl(url: string): Promise<{ key: string; title: string }> {
        throw new Error('Not implemented')
    }

    public async isFullscreen() {
        return true
    }

    public async setFullscreen(enabled: boolean): Promise<void> {
        return
    }
}
