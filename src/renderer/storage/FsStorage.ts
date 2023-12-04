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

    public async setBlob(key: string, value: string) {
        return await runtime.setStoreBlob(key, value)
    }
    public async getBlob(key: string): Promise<string | null> {
        return await runtime.getStoreBlob(key)
    }
    public async delBlob(key: string) {
        return await runtime.delStoreBlob(key)
    }
    public async getBlobKeys(): Promise<string[]> {
        return await runtime.listStoreBlobKeys()
    }
}
