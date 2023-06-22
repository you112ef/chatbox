import { Store } from "tauri-plugin-store-api";
import BaseStorage from './BaseStorage'

export default class FsStorage extends BaseStorage {
    private filepath: string
    private store: Store
    private timer: NodeJS.Timeout

    constructor(filepath = 'config.json') {
        super()
        this.filepath = filepath
        this.store = new Store(this.filepath)
        this.timer = setInterval(async () => {
            try {
                await this.store.save()
            } catch (e) {
                console.log(e)
            }
        }, 5 * 60 * 1000)
    }

    public async setItem<T>(key: string, value: T) {
        await this.store.set(key, value)
    }

    public async getItem<T>(key: string, initialValue: T): Promise<T> {
        let value: any = await this.store.get(key)
        if (value === undefined || value === null) {
            value = initialValue
        }
        return value
    }

    public async removeItem(key: string) {
        await this.store.delete(key)
    }

    public async save() {
        await this.store.save()
    }

}
