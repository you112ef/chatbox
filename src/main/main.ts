/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import os from 'os'
import path from 'path'
import { app, BrowserWindow, shell, ipcMain, nativeTheme, session, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import MenuBuilder from './menu'
import { resolveHtmlPath } from './util'
import Locale from './locales'
import { store, getConfig, getSettings } from './store-node'
import * as shortcuts from './shortcut'
import * as proxy from './proxy'
import * as windowState from './window_state'
import * as fs from 'fs-extra'
import * as analystic from './analystic-node'
import sanitizeFilename from 'sanitize-filename'

// 这行代码是解决 Windows 通知的标题和图标不正确的问题，标题会错误显示成 electron.app.Chatbox
// 参考：https://stackoverflow.com/questions/65859634/notification-from-electron-shows-electron-app-electron
if (process.platform === 'win32') {
    app.setAppUserModelId(app.name)
}

class AppUpdater {
    constructor() {
        log.transports.file.level = 'info'
        const locale = new Locale()

        autoUpdater.logger = log
        autoUpdater.setFeedURL('https://chatboxai.app/api/auto_upgrade')
        autoUpdater.checkForUpdatesAndNotify()
        let hasDialog = false
        autoUpdater.on('update-downloaded', (event) => {
            if (hasDialog) {
                return
            }
            hasDialog = true
            dialog
                .showMessageBox({
                    type: 'info',
                    buttons: [locale.t('Restart'), locale.t('Later')],
                    title: locale.t('App_Update'),
                    message: event.releaseName || locale.t('New_Version'),
                    detail: locale.t('New_Version_Downloaded'),
                })
                .then((returnValue) => {
                    if (returnValue.response === 0) autoUpdater.quitAndInstall()
                })
        })
    }
}

let mainWindow: BrowserWindow | null = null

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support')
    sourceMapSupport.install()
}

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'

if (isDebug) {
    require('electron-debug')()
}

// const installExtensions = async () => {
//     const installer = require('electron-devtools-installer')
//     const forceDownload = !!process.env.UPGRADE_EXTENSIONS
//     const extensions = ['REACT_DEVELOPER_TOOLS']

//     return installer
//         .default(
//             extensions.map((name) => installer[name]),
//             forceDownload
//         )
//         .catch(console.log)
// }

const createWindow = async () => {
    if (isDebug) {
        // 不在安装 DEBUG 浏览器插件。可能不兼容，所以不如直接在网页里debug
        // await installExtensions()
    }

    const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../../assets')

    const getAssetPath = (...paths: string[]): string => {
        return path.join(RESOURCES_PATH, ...paths)
    }

    const [state] = windowState.getState()

    mainWindow = new BrowserWindow({
        show: false,
        width: state.width,
        height: state.height,
        x: state.x,
        y: state.y,
        minWidth: windowState.minWidth,
        minHeight: windowState.minHeight,
        icon: getAssetPath('icon.png'),
        webPreferences: {
            spellcheck: true,
            webSecurity: false,
            allowRunningInsecureContent: false,
            preload: app.isPackaged
                ? path.join(__dirname, 'preload.js')
                : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
    })

    mainWindow.loadURL(resolveHtmlPath('index.html'))

    mainWindow.on('ready-to-show', () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined')
        }
        if (process.env.START_MINIMIZED) {
            mainWindow.minimize()
        } else {
            if (state.mode === windowState.WindowMode.Maximized) {
                mainWindow.maximize()
            }
            if (state.mode === windowState.WindowMode.Fullscreen) {
                mainWindow.setFullScreen(true)
            }
            mainWindow.show()
        }
    })

    // 窗口关闭时保存窗口大小与位置
    mainWindow.on('close', () => {
        if (mainWindow) {
            windowState.saveState(mainWindow)
        }
    })

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    const menuBuilder = new MenuBuilder(mainWindow)
    menuBuilder.buildMenu()

    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url)
        return { action: 'deny' }
    })

    // 隐藏 Windows, Linux 应用顶部的菜单栏
    // https://www.computerhope.com/jargon/m/menubar.htm
    mainWindow.setMenuBarVisibility(false)

    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    new AppUpdater()

    // 网络问题
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                // 'Content-Security-Policy': ['default-src \'self\'']
                // 'Content-Security-Policy': ['*'], // 为了支持代理
            },
        })
    })

    // 监听系统主题更新
    nativeTheme.on('updated', () => {
        mainWindow?.webContents.send('native-theme-updated')
    })
}

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.whenReady()
    .then(() => {
        createWindow()
        app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (mainWindow === null) createWindow()
        })
        // 监听窗口大小位置变化的代码，很大程度参考了 VSCODE 的实现 /Users/benn/Documents/w/vscode/src/vs/platform/windows/electron-main/windowsStateHandler.ts
        // When a window looses focus, save all windows state. This allows to
        // prevent loss of window-state data when OS is restarted without properly
        // shutting down the application (https://github.com/microsoft/vscode/issues/87171)
        app.on('browser-window-blur', () => {
            if (mainWindow) {
                windowState.saveState(mainWindow)
            }
        })
        shortcuts.init(() => mainWindow)
        proxy.init()
        app.on('will-quit', () => {
            shortcuts.unregister()
        })
    })
    .catch(console.log)

// IPC

ipcMain.handle('getStoreValue', (event, key) => {
    return store.get(key)
})
ipcMain.handle('setStoreValue', (event, key, dataJson) => {
    // 仅在传输层用 JSON 序列化，存储层用原生数据，避免存储层 JSON 损坏后无法自动处理的情况
    const data = JSON.parse(dataJson)
    return store.set(key, data)
})
ipcMain.handle('delStoreValue', (event, key) => {
    return store.delete(key)
})
ipcMain.handle('getAllStoreValues', (event) => {
    return JSON.stringify(store.store)
})
ipcMain.handle('setAllStoreValues', (event, dataJson) => {
    const data = JSON.parse(dataJson)
    store.store = data
})
ipcMain.handle('getStoreBlob', async (event, key) => {
    const filename = path.resolve(app.getPath('userData'), 'chatbox-blobs', sanitizeFilename(key))
    const exists = await fs.pathExists(filename)
    if (!exists) {
        return null
    }
    return fs.readFile(filename, { encoding: 'utf-8' })
})
ipcMain.handle('setStoreBlob', async (event, key, value: string) => {
    const filename = path.resolve(app.getPath('userData'), 'chatbox-blobs', sanitizeFilename(key))
    await fs.ensureDir(path.dirname(filename))
    return fs.writeFile(filename, value, { encoding: 'utf-8' })
})
ipcMain.handle('delStoreBlob', async (event, key) => {
    const filename = path.resolve(app.getPath('userData'), 'chatbox-blobs', sanitizeFilename(key))
    const exists = await fs.pathExists(filename)
    if (!exists) {
        return
    }
    await fs.remove(filename)
})
ipcMain.handle('listStoreBlobKeys', async (event) => {
    const dir = path.resolve(app.getPath('userData'), 'chatbox-blobs')
    const exists = await fs.pathExists(dir)
    if (!exists) {
        return []
    }
    return fs.readdir(dir)
})

ipcMain.handle('getVersion', () => {
    return app.getVersion()
})
ipcMain.handle('getPlatform', () => {
    return process.platform
})
ipcMain.handle('getHostname', () => {
    return os.hostname()
})
ipcMain.handle('getLocale', () => {
    try {
        return app.getLocale()
    } catch (e: any) {
        return ''
    }
})
ipcMain.handle('openLink', (event, link) => {
    return shell.openExternal(link)
})
ipcMain.handle('ensureShortcutConfig', (event, json) => {
    const config: { disableQuickToggleShortcut: boolean } = JSON.parse(json)
    if (config.disableQuickToggleShortcut) {
        shortcuts.unregister()
    } else {
        shortcuts.register(() => mainWindow)
    }
})

ipcMain.handle('shouldUseDarkColors', () => nativeTheme.shouldUseDarkColors)

ipcMain.handle('ensureProxy', (event, json) => {
    const config: { proxy?: string } = JSON.parse(json)
    proxy.ensure(config.proxy)
})

ipcMain.handle('relaunch', () => {
    app.relaunch()
    app.quit()
})

ipcMain.handle('analysticTrackingEvent', (event, dataJson) => {
    const data = JSON.parse(dataJson)
    analystic.event(data.name, data.params).catch((e) => {
        log.error('analystic_tracking_event', e)
    })
})

ipcMain.handle('getConfig', (event) => {
    return getConfig()
})

ipcMain.handle('getSettings', (event) => {
    return getSettings()
})
