import { BrowserWindow, globalShortcut } from 'electron'
import * as store from './store'

const shortcutMap = {
    'Alt+`': quickToggle,
    'Option+`': quickToggle,
}

function quickToggle(mainWindow: BrowserWindow | null) {
    if (!mainWindow) {
        return
    }
    if (mainWindow.isMinimized()) {
        mainWindow.restore()
        mainWindow.focus()
        mainWindow.webContents.send('window-show')
    } else if (mainWindow?.isFocused()) {
        mainWindow.minimize()
    } else {
        // 解决MacOS下无法聚焦的问题
        mainWindow.hide()
        mainWindow.show()
        mainWindow.focus()
        // 解决MacOS全屏下无法聚焦的问题
        mainWindow.webContents.send('window-show')
    }
}

export function register(getMainWindow: () => BrowserWindow | null) {
    for (const [shortcut, handler] of Object.entries(shortcutMap)) {
        globalShortcut.register(shortcut, () => handler(getMainWindow()))
    }
}

export function unregister() {
    for (const shortcut of Object.keys(shortcutMap)) {
        globalShortcut.unregister(shortcut)
    }
}

export function init(getMainWindow: () => BrowserWindow | null) {
    const settings = store.getSettings()
    if (settings.disableQuickToggleShortcut) {
        return
    }
    register(getMainWindow)
}
