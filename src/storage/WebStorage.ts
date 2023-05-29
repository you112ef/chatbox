import Interface from './Interface'
import store from 'store'

export default class WebStorage implements Interface {
    constructor() {
    }

    public async set(key: string, value: any) {
        return store.set(key, value)
    }

    public async get<T>(key: string): Promise<T | undefined> {
        return store.get(key) || undefined
    }

    public async del(key: string) {
        return store.remove(key)
    }
}
