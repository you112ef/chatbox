import log from 'electron-log'
import Store from 'electron-store'
import { Settings } from '../shared/types'
import * as defaults from '../shared/defaults'

interface StoreType {
    'settings': Settings
}

export const store = new Store<StoreType>({
    clearInvalidConfig: true, // 当配置JSON不合法时，清空配置
})
log.info('store path:', store.path)

export function getSettings() {
    const settings = store.get<'settings'>('settings', defaults.settings())
    return settings
}
