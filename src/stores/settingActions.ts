import { getDefaultStore } from 'jotai'
import * as atoms from './atoms'
import * as defaults from './defaults'

export function needEditSetting() {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    if (
        settings.aiProvider === 'openai' &&
        settings.openaiKey === '' &&
        settings.apiHost === defaults.settings().apiHost
    ) {
        return true
    }
    if (
        settings.aiProvider === 'azure' &&
        (settings.azureApikey === '' || settings.azureDeploymentName === '' || settings.azureEndpoint === '')
    ) {
        return true
    }
    if (
        settings.aiProvider === 'chatglm-6b' &&
        settings.chatglm6bUrl === ''
    ) {
        return true
    }
    return false
}
