import { ElectronIPC } from "src/shared/electron-types"
import { Platform, PlatformType } from "./interfaces"
import { Config } from "src/shared/types"

export default class DesktopPlatform implements Platform {
    public type: PlatformType = 'desktop'

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

    public async getConfig(): Promise<Config> {
        return this.ipc.invoke('getConfig')
    }

    public initTracking(): void {
        this.trackingEvent('user_engagement', {})
    }
    public trackingEvent(name: string, params: { [key: string]: string }) {
        const dataJson = JSON.stringify({ name, params })
        this.ipc.invoke('analysticTrackingEvent', dataJson)
    }
}
