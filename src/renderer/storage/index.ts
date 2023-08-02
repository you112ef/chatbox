import StoreStorage from './StoreStorage'
import * as defaults from '../stores/defaults'

const storage = new StoreStorage()

export default storage

export async function getConfig() {
    return storage.getItem('configs', defaults.configs())
}
