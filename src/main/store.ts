import log from 'electron-log'
import Store from 'electron-store'
import { Settings } from '../shared/types'

export const store = new Store({
    clearInvalidConfig: true, // 当配置JSON不合法时，清空配置
})
log.info('store path:', store.path)

export function getSettings() {
    const settings = store.get('settings') as Settings
    return settings
}
