import { getDefaultStore } from 'jotai'
import { settingsAtom, configVersionAtom, sessionsAtom, languageAtom } from './atoms'
import { imageCreatorSessionForCN, imageCreatorSessionForEN } from '@/packages/initial_data'
import * as runtime from '@/packages/runtime'
import WebStorage from '@/storage/WebStorage'
import storage from '@/storage'

export function migrate() {
    // 通过定时器延迟启动，防止处理状态底层存储的异步加载前错误的初始数据（水合阶段）
    setTimeout(_migrate, 2000)
}

async function _migrate() {
    const store = getDefaultStore()
    let configVersion = store.get(configVersionAtom)

    if (configVersion < 1) {
        migrate_0_to_1()
        configVersion = 1
        store.set(configVersionAtom, configVersion)
    }
    if (configVersion < 2) {
        await migrate_1_to_2()
        configVersion = 2
        store.set(configVersionAtom, configVersion)
    }
    if (configVersion < 3) {
        await migrate_2_to_3()
        configVersion = 3
        store.set(configVersionAtom, configVersion)
    }
}

function migrate_0_to_1() {
    const store = getDefaultStore()
    const settings = store.get(settingsAtom)
    // 如果历史版本的用户开启了消息的token计数展示，那么也帮他们开启token消耗展示
    if (settings.showTokenCount) {
        settings.showTokenUsed = true
        store.set(settingsAtom, { ...settings })
    }
}

async function migrate_1_to_2() {
    const store = getDefaultStore()
    const sessions = store.get(sessionsAtom)
    const lang = await runtime.getLocale()
    if (lang.startsWith('zh')) {
        if (sessions.find((session) => session.id === imageCreatorSessionForCN.id)) {
            return
        }
        store.set(sessionsAtom, [imageCreatorSessionForCN, ...sessions])
    } else {
        if (sessions.find((session) => session.id === imageCreatorSessionForEN.id)) {
            return
        }
        store.set(sessionsAtom, [imageCreatorSessionForEN, ...sessions])
    }
}

async function migrate_2_to_3() {
    // 原来 Electron 应用存储图片 base64 数据到 IndexedDB，现在改成本地文件存储
    if (runtime.runtime !== 'electron') {
        return
    }
    const ws = new WebStorage()
    const blobKeys = await ws.getBlobKeys()
    for (const key of blobKeys) {
        const value = await ws.getBlob(key)
        if (!value) {
            continue
        }
        await storage.setBlob(key, value)
        await ws.delBlob(key)
    }
}
