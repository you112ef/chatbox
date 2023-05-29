export default interface StorageInterface {
    set(key: string, value: any): Promise<void>
    get(key: string): Promise<any|undefined>
    del(key: string): Promise<void>
}
