import Interface from './BaseStorage'
import store from 'store'

export default class WebStorage implements Interface {
    constructor() {}

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
}
