import { getDefaultStore } from 'jotai'
import { settingsAtom, configVersionAtom } from './atoms'

export function migrate() {
    // 通过定时器延迟启动，防止处理状态底层存储的异步加载前错误的初始数据（水合阶段）
    setTimeout(_migrate, 600)
}

function _migrate() {
    const store = getDefaultStore()
    let configVersion = store.get(configVersionAtom)

    if (configVersion < 1) {
        migrate_0_to_1()
        configVersion = 1
        store.set(configVersionAtom, configVersion)
    }
}

function migrate_0_to_1() {
    const store = getDefaultStore()
    const settings = store.get(settingsAtom)
    // 如果历史版本的用户开启了消息的token计数展示，那么也帮他们开启token消耗展示
    if (settings.showTokenCount) {
        settings.showTokenUsed = true
        store.set(settingsAtom, {...settings})
    }
}
