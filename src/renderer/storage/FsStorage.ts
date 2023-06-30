import BaseStorage from './BaseStorage'
import * as api from '../api'

export default class FsStorage extends BaseStorage {
    constructor(filepath = 'config.json') {
        super()
    }

    public async setItem<T>(key: string, value: T) {
        await api.setStore(key, value)
    }

    public async getItem<T>(key: string, initialValue: T): Promise<T> {
        let value: any = await api.getStore(key)
        if (value === undefined || value === null) {
            value = initialValue
        }
        return value
    }

    public async removeItem(key: string): Promise<void> {
        await api.delStore(key)
    }

    public async save() {}
}
