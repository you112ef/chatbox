import { BrowserWindow, globalShortcut } from 'electron'
import * as store from './store-node'

interface State {
    getMainWindow: () => BrowserWindow | null
    createWindow: () => Promise<BrowserWindow>
}

const shortcutMap = {
    'Alt+`': quickToggle,
    'Option+`': quickToggle,
}

export function quickToggle(state: State) {
    const mainWindow = state.getMainWindow()
    if (!mainWindow) {
        state.createWindow()
        return
    }
    if (mainWindow.isMinimized()) {
        mainWindow.restore()
        mainWindow.focus()
        mainWindow.webContents.send('window-show')
    } else if (mainWindow?.isFocused()) {
        // 解决MacOS全屏下隐藏将黑屏的问题
        if (mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false)
        }
        mainWindow.hide()
        // mainWindow.minimize()
    } else {
        // 解决MacOS下无法聚焦的问题
        mainWindow.hide()
        mainWindow.show()
        mainWindow.focus()
        // 解决MacOS全屏下无法聚焦的问题
        mainWindow.webContents.send('window-show')
    }
}

export function register(state: State) {
    for (const [shortcut, handler] of Object.entries(shortcutMap)) {
        globalShortcut.register(shortcut, () => handler(state))
    }
}

export function unregister() {
    for (const shortcut of Object.keys(shortcutMap)) {
        globalShortcut.unregister(shortcut)
    }
}

export function init(state: State) {
    const settings = store.getSettings()
    if (settings.disableQuickToggleShortcut) {
        return
    }
    register(state)
}
