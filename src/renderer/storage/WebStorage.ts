import BaseStorage from './BaseStorage'
import store from 'store'

export default class WebStorage extends BaseStorage {
    constructor() {
        super()
    }

    public async setItem<T>(key: string, value: T) {
        return store.set(key, value)
    }

    public async getItem<T>(key: string, initialValue: T): Promise<T> {
        let value = store.get(key)
        if (value === undefined || value === null) {
            value = initialValue
        }
        return value
    }

    public async removeItem(key: string) {
        return store.remove(key)
    }

    public async save() {
        return
    }

    public async getAll() {
        const ret: { [key: string]: any } = {}
        store.each((value, key) => {
            ret[key] = value
        })
        return ret
    }

    public async setAll(data: { [key: string]: any }) {
        store.clearAll()
        for (const [key, value] of Object.entries(data)) {
            store.set(key, value)
        }
    }
}
