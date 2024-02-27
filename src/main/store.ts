import log from 'electron-log'
import Store from 'electron-store'
import { Config, Settings } from '../shared/types'
import * as defaults from '../shared/defaults'

interface StoreType {
    settings: Settings
    configs: Config
}

export const store = new Store<StoreType>({
    clearInvalidConfig: true, // 当配置JSON不合法时，清空配置
})
log.info('store path:', store.path)

export function getSettings(): Settings {
    const settings = store.get<'settings'>('settings', defaults.settings())
    return settings
}

export function getConfig(): Config {
    const configs = store.get<'configs'>('configs', defaults.newConfigs())
    return configs
}
