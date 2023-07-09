import { getOS, getBrowser } from './navigator'
import { isWeb } from './env'

const electronAPI = window.electronAPI

export const runtime = electronAPI ? 'electron' : 'web'

export const setStore = (key: string, value: any) => {
    if (!electronAPI) {
        return
    }
    // 为什么要序列化？
    // 为了实现进程通信，electron invoke 会自动对传输数据进行序列化，
    // 但如果数据包含无法被序列化的类型（比如 message 中常带有的 cancel 函数）将直接报错：
    // Uncaught (in promise) Error: An object could not be cloned.
    // 因此对于数据类型不容易控制的场景，应该提前 JSON.stringify，这种序列化方式会自动处理异常类型。
    const valueJson = JSON.stringify(value)
    return electronAPI.invoke('setStoreValue', key, valueJson)
}

export const getStore = (key: string) => {
    if (!electronAPI) {
        return
    }
    return electronAPI.invoke('getStoreValue', key)
}

export const delStore = (key: string) => {
    if (!electronAPI) {
        return
    }
    return electronAPI.invoke('delStoreValue', key)
}

export const shouldUseDarkColors = async (): Promise<boolean> => {
    if (isWeb) {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    if (!electronAPI) {
        return false
    }
    return electronAPI.invoke('shouldUseDarkColors')
}

export async function onSystemThemeChange(callback: () => void) {
    if (isWeb) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', callback)
        return () => {
            window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', callback)
        }
    }
    if (!electronAPI) {
        return () => null
    }
    return electronAPI.onSystemThemeChange(callback)
}

export const getVersion = async () => {
    if (isWeb) {
        return 'Web'
    }
    if (!electronAPI) {
        return 'Unknown'
    }
    return electronAPI.invoke('getVersion')
}

export const openLink = async (url: string) => {
    if (isWeb) {
        window.open(url)
        return
    }
    if (!electronAPI) {
        return
    }
    electronAPI.invoke('openLink', url)
}

export const getPlatform = async () => {
    if (isWeb) {
        return 'web'
    }
    if (!electronAPI) {
        return 'unknown'
    }
    return electronAPI.invoke('getPlatform')
}

export async function getInstanceName() {
    const platform = await getPlatform()
    if (platform === 'web') {
        return `${getOS()} / ${getBrowser()}`
    }
    return platform
}

export async function exportTextFile(filename: string, content: string) {
    exportTextFileFromWebPage(filename, content)
    return
    // if (isWeb) {
    //     exportTextFileFromWebPage(filename, content);
    //     return;
    // }
    // const extensions = filename.split('.').slice(1);
    // const filePath = await api.dialog.save({
    //     filters: [
    //         {
    //             name: filename,
    //             extensions: extensions,
    //         },
    //     ],
    // });
    // if (filePath) {
    //     await api.fs.writeTextFile(filePath!!, content);
    // }
}

function exportTextFileFromWebPage(filename: string, content: string) {
    var eleLink = document.createElement('a')
    eleLink.download = filename
    eleLink.style.display = 'none'
    var blob = new Blob([content])
    eleLink.href = URL.createObjectURL(blob)
    document.body.appendChild(eleLink)
    eleLink.click()
    document.body.removeChild(eleLink)
}

export const getLocale = async () => {
    if (isWeb) {
        return '' // 网页版暂时不自动更改语言，防止网址封禁
    }
    if (!electronAPI) {
        return ''
    }
    return electronAPI.invoke('getLocale')
}
