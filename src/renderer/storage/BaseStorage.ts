import localforage from 'localforage'

export default class BaseStorage {
    constructor() {}

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

    public async getAll(): Promise<{ [key: string]: any }> {
        throw new Error('not implemented')
    }

    public async setAll(data: { [key: string]: any }) {
        throw new Error('not implemented')
    }

    // TODO: 这些数据也应该实现数据导出与导入
    public async setBlob<T>(key: string, value: T) {
        return localforage.setItem(key, value)
    }
    public async getBlob<T>(key: string) {
        return localforage.getItem<T>(key)
    }
    public async delBlob<T>(key: string) {
        return localforage.removeItem(key)
    }
    public async getBlobKeys() {
        return localforage.keys()
    }
    // subscribe(key: string, callback: any, initialValue: any): Promise<void>
}
