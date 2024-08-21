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
    lastShownAboutDialogVersion: string // 上次启动时自动弹出关于对话框的应用版本
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

// ------------------ backup ------------------

export async function backup() {
    const configPath = path.resolve(app.getPath('userData'), 'config.json')
    if (!fs.existsSync(configPath)) {
        return
    }
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const backupPath = path.resolve(app.getPath('userData'), `config-backup-${year}-${month}-${day}.json`)
    try {
        await fs.copy(configPath, backupPath)
    } catch (err) {
        log.error('Failed to backup config:', err)
        return
    }
    return backupPath
}

export async function getBackups() {
    let filenames: string[]
    try {
        filenames = await fs.readdir(app.getPath('userData'))
    } catch (err) {
        log.error('Failed to read directory:', err)
        return []
    }
    const backupFilenames = filenames.filter((filename) => filename.startsWith('config-backup-'))
    if (backupFilenames.length === 0) {
        return []
    }
    let backupFileInfos = backupFilenames.map((filename) => {
        const dateStr = filename.replace('config-backup-', '').replace('.json', '')
        const date = new Date(dateStr)
        return {
            filename,
            // date,
            dateMs: date.getTime() || 0,
        }
    })
    backupFileInfos = backupFileInfos.sort((a, b) => a.dateMs - b.dateMs)
    return backupFileInfos
}

export async function needBackup() {
    // 7天备份一次
    const backups = await getBackups()
    if (backups.length === 0) {
        return true
    }
    const lastBackup = backups[backups.length - 1]
    return lastBackup.dateMs < Date.now() - 7 * 24 * 60 * 60 * 1000
}

export async function clearBackups() {
    // 保留最近10个备份
    const backups = await getBackups()
    if (backups.length < 10) {
        return
    }
    const needDelete = backups.slice(0, backups.length - 10)
    try {
        await Promise.all(
            needDelete.map(async (backup) => {
                const backupPath = path.resolve(app.getPath('userData'), backup.filename)
                await fs.remove(backupPath)
                log.info('clear backup:', backup.filename)
            })
        )
    } catch (err) {
        log.error('Failed to clear backups:', err)
    }
}

export async function autoBackup() {
    if (await needBackup()) {
        const filename = await backup()
        if (filename) {
            log.info('auto backup:', filename)
        }
    }
    await clearBackups()
}
