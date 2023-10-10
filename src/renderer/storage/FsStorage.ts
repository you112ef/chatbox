import BaseStorage from './BaseStorage'
import * as runtime from '../packages/runtime'

export default class FsStorage extends BaseStorage {
    constructor(filepath = 'config.json') {
        super()
    }

    public async setItem<T>(key: string, value: T) {
        await runtime.setStore(key, value)
    }

    public async getItem<T>(key: string, initialValue: T): Promise<T> {
        let value: any = await runtime.getStore(key)
        if (value === undefined || value === null) {
            value = initialValue
        }
        return value
    }

    public async removeItem(key: string): Promise<void> {
        await runtime.delStore(key)
    }

    public async getAll(): Promise<{ [key: string]: any }> {
        return runtime.getAllStoreValues()
    }

    public async setAll(data: { [key: string]: any }) {
        return runtime.setAllStoreValues(data)
    }

    public async save() {}
}
