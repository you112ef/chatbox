import { getDefaultStore } from 'jotai'
import { settingsAtom, configVersionAtom, sessionsAtom } from './atoms'
import * as defaults from '../../shared/defaults'
import { imageCreatorSessionForCN, imageCreatorSessionForEN } from '@/packages/initial_data'
import platform from '@/platform'
import WebPlatform from '@/platform/web_platform'
import storage, { StorageKey } from '@/storage'

export function migrate() {
    // 通过定时器延迟启动，防止处理状态底层存储的异步加载前错误的初始数据（水合阶段）
    setTimeout(_migrate, 2000)
}

async function _migrate() {
    let configVersion = await storage.getItem(StorageKey.ConfigVersion, 0)
    if (configVersion < 1) {
        await migrate_0_to_1()
        configVersion = 1
        await storage.setItem(StorageKey.ConfigVersion, configVersion)
        getDefaultStore().set(configVersionAtom, configVersion)
    }
    if (configVersion < 2) {
        await migrate_1_to_2()
        configVersion = 2
        await storage.setItem(StorageKey.ConfigVersion, configVersion)
        getDefaultStore().set(configVersionAtom, configVersion)
    }
    if (configVersion < 3) {
        await migrate_2_to_3()
        configVersion = 3
        await storage.setItem(StorageKey.ConfigVersion, configVersion)
        getDefaultStore().set(configVersionAtom, configVersion)
    }
}

async function migrate_0_to_1() {
    const settings = await storage.getItem(StorageKey.Settings, defaults.settings())
    // 如果历史版本的用户开启了消息的token计数展示，那么也帮他们开启token消耗展示
    if (settings.showTokenCount) {
        settings.showTokenUsed = true
        getDefaultStore().set(settingsAtom, { ...settings })
    }
}

async function migrate_1_to_2() {
    const sessions = await storage.getItem(StorageKey.ChatSessions, defaults.sessions())
    const lang = await platform.getLocale()
    if (lang.startsWith('zh')) {
        if (sessions.find((session) => session.id === imageCreatorSessionForCN.id)) {
            return
        }
        getDefaultStore().set(sessionsAtom, [
            ...sessions,
            imageCreatorSessionForCN,
        ])
    } else {
        if (sessions.find((session) => session.id === imageCreatorSessionForEN.id)) {
            return
        }
        getDefaultStore().set(sessionsAtom, [
            ...sessions,
            imageCreatorSessionForEN,
        ])
    }
}

async function migrate_2_to_3() {
    // 原来 Electron 应用存储图片 base64 数据到 IndexedDB，现在改成本地文件存储
    if (platform.type !== 'desktop') {
        return
    }
    const ws = new WebPlatform()
    const blobKeys = await ws.listStoreBlobKeys()
    for (const key of blobKeys) {
        const value = await ws.getStoreBlob(key)
        if (!value) {
            continue
        }
        await storage.setBlob(key, value)
        await ws.delStoreBlob(key)
    }
}
