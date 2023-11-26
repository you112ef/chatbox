import { getDefaultStore } from 'jotai'
import { settingsAtom, configVersionAtom, sessionsAtom, languageAtom } from './atoms'
import { imageCreatorSessionForCN, imageCreatorSessionForEN } from '@/packages/initial_data'

export function migrate() {
    // 通过定时器延迟启动，防止处理状态底层存储的异步加载前错误的初始数据（水合阶段）
    setTimeout(_migrate, 600)
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
    const lang = store.get(languageAtom)
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
