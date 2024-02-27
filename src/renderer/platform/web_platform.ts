import { Config } from "src/shared/types"
import * as defaults from 'src/shared/defaults'
import { Platform, PlatformType } from "./interfaces"
import store from 'store'

export default class WebPlatform implements Platform {
    public type: PlatformType = 'web'

    constructor() {
    }

    public async getVersion(): Promise<string> {
        return ''
    }
    public async getPlatform(): Promise<string> {
        return 'web'
    }

    public async getConfig(): Promise<Config> {
        let value = store.get('configs')
        if (value === undefined || value === null) {
            value = defaults.newConfigs()
            store.set('configs', value)
        }
        return value
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
}
