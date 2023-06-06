export default class BaseStorage {
    constructor() { }

    public async setItem<T>(key: string, value: T): Promise<void> {
        throw new Error('not implemented')
    }

    // getItem 需要保证如果数据不存在，返回默认值的同时，也要将默认值写入存储
    public async getItem<T>(key: string, initialValue: T): Promise<T> {
        throw new Error('not implemented')
    }

    public async removeItem(key: string): Promise<void> {
        throw new Error('not implemented')
    }

    public async save() {
        throw new Error('not implemented')
    }

    // subscribe(key: string, callback: any, initialValue: any): Promise<void>
}
