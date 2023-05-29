import { Store } from "tauri-plugin-store-api";
import Interface from './Interface'

export default class FsStorage implements Interface {
    private filepath: string
    private store: Store
    private timer: NodeJS.Timeout

    constructor(filepath = 'config.json') {
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

    public async set(key: string, value: any) {
        await this.store.set(key, value)
        if (key === 'settings') {
            await this.store.save()
        }
    }

    public async get<T>(key: string): Promise<T | undefined> {
        const value: any = await this.store.get(key)
        return value || undefined
    }

    public async del(key: string) {
        await this.store.delete(key)
    }
}
