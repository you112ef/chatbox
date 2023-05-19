import * as api from '@tauri-apps/api'
import FsStorage from './storage/FsStorage'
import WebStorage from './storage/WebStorage'
import { isWeb } from './env'


export const storage = isWeb ? new WebStorage() : new FsStorage()

export const shouldUseDarkColors = async (): Promise<boolean> => {
    if (isWeb) {
        return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    const theme = await api.window.appWindow.theme()
    return theme === 'dark'
}

export async function onSystemThemeChange(callback: () => void) {
    if (isWeb) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', callback)
        return () => {
            window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', callback)
        }
    }
    return api.window.appWindow.onThemeChanged(callback)
}

export const getVersion = async () => {
    if (isWeb) {
        return 'Web'
    }
    return api.app.getVersion()
}

export const openLink = async (url: string) => {
    if (isWeb) {
        window.open(url)
        return
    }
    return api.shell.open(url)
}

export const getPlatform = async () => {
    if (isWeb) {
        return 'web'
    }
    return api.os.platform()
}

export async function exportTextFile(filename: string, content: string) {
    if (isWeb) {
        exportTextFileFromWebPage(filename, content)
        return
    }
    const extensions = filename.split('.').slice(1)
    const filePath = await api.dialog.save({
        filters: [{
            name: filename,
            extensions: extensions
        }]
    });
    if (filePath) {
        await api.fs.writeTextFile(filePath!!, content)
    }
}

function exportTextFileFromWebPage(filename: string, content: string) {
    var eleLink = document.createElement('a');
    eleLink.download = filename;
    eleLink.style.display = 'none';
    var blob = new Blob([content]);
    eleLink.href = URL.createObjectURL(blob);
    document.body.appendChild(eleLink);
    eleLink.click();
    document.body.removeChild(eleLink);
};

export async function httpPost(url: string, header: {[key: string]: string}, body: string) {
    if (isWeb) {
        const res = await fetch(url, {
            method: 'POST',
            headers: header,
            body: body
        })
        return res.json()
    }
    const res = await api.http.fetch(url, {
        method: 'POST',
        headers: header,
        body: api.http.Body.text(body)
    })
    return res.data
}
