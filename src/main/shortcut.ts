import { BrowserWindow } from 'electron'
import * as store from './store'

export function quickToggle(mainWindow: BrowserWindow | null) {
    if (!mainWindow) {
        return
    }
    const settings = store.getSettings()
    if (settings.disableQuickToggleShortcut) {
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
