import FsStorage from './FsStorage';
import WebStorage from './WebStorage';
import { isWeb } from '../env';
import BaseStorage from './BaseStorage';
import { sessions as defaultSessions } from '../defaults';

export const Storage: new () => BaseStorage = isWeb ? WebStorage : FsStorage;

export default class StoreStorage extends Storage {
    constructor() {
        super();
    }
    public async getItem<T>(key: string, initialValue: T): Promise<T> {
        let value: T = await super.getItem(key, initialValue);

        if (key === 'chat-sessions' && value === initialValue) {
            value = defaultSessions as T;
            await super.setItem(key, value);
        }
        if (key === 'configs' && value === initialValue) {
            await super.setItem(key, initialValue); // 持久化初始生成的 uuid
            await super.save();
        }

        return value;
    }
    public async setItem<T>(key: string, value: T) {
        await super.setItem(key, value);
        if (key === 'settings') {
            await super.save();
        }
    }
}
