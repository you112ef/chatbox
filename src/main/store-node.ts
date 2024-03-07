import log from 'electron-log'
import Store from 'electron-store'
import { Config, Settings } from '../shared/types'
import * as defaults from '../shared/defaults'
import path from 'path'
import { app } from 'electron'
import * as fs from 'fs-extra'

interface StoreType {
    settings: Settings
    configs: Config
}

export const store = new Store<StoreType>({
    clearInvalidConfig: true, // 当配置JSON不合法时，清空配置
})
log.info('store path:', store.path)

// 自动备份
autoBackup().catch((err) => {
    log.error('auto backup error:', err)
})

export function getSettings(): Settings {
    const settings = store.get<'settings'>('settings', defaults.settings())
    return settings
}

export function getConfig(): Config {
    let configs = store.get<'configs'>('configs')
    if (!configs) {
        configs = defaults.newConfigs()
        store.set<'configs'>('configs', configs)
    }
    return configs
}

export async function backup() {
    const configPath = path.resolve(app.getPath('userData'), 'config.json')
    if (!fs.existsSync(configPath)) {
        return
    }
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const backupPath = path.resolve(app.getPath('userData'), `config-backup-${year}-${month}-${day}.json`)
    await fs.copy(configPath, backupPath)
    return backupPath
}

export async function needBackup() {
    const filenames = await fs.readdir(app.getPath('userData'))
    const backupFilenames = filenames.filter((filename) => filename.startsWith('config-backup-'))
    if (backupFilenames.length === 0) {
        return true
    }
    // 是否大于7天
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return backupFilenames.some((filename) => {
        const dateStr = filename.replace('config-backup-', '').replace('.json', '')
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) {
            return false
        }
        return date < sevenDaysAgo
    })
}

export async function autoBackup() {
    if (await needBackup()) {
        const filename = await backup()
        log.info('auto backup:', filename)
    }
}
