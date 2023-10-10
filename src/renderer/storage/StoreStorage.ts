import FsStorage from './FsStorage'
import WebStorage from './WebStorage'
import { isWeb } from '../packages/runtime'
import BaseStorage from './BaseStorage'
import { sessions as defaultSessions } from '../packages/initial_data'
import * as defaults from '../stores/defaults'

export enum StorageKey {
    ChatSessions = 'chat-sessions',
    Configs = 'configs',
    Settings = 'settings',
    MyCopilots = 'myCopilots',
    ConfigVersion = 'configVersion',
}

// 根据运行环境，选择不同的存储方式
const Storage: new () => BaseStorage = isWeb ? WebStorage : FsStorage
export default class StoreStorage extends Storage {
    constructor() {
        super()
    }
    public async getItem<T>(key: string, initialValue: T): Promise<T> {
        let value: T = await super.getItem(key, initialValue)

        if (key === StorageKey.ChatSessions && value === initialValue) {
            value = defaultSessions as T
            await super.setItem(key, value)
        }
        if (key === StorageKey.Configs && value === initialValue) {
            await super.setItem(key, initialValue) // 持久化初始生成的 uuid
            await super.save()
        }

        return value
    }
    public async setItem<T>(key: string, value: T) {
        await super.setItem(key, value)
        if (key === StorageKey.Settings) {
            await super.save()
        }
    }

    public async getConfig() {
        return this.getItem(StorageKey.Configs, defaults.configs())
    }
}
