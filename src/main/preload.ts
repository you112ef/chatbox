// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// export type Channels = 'ipc-example';

const electronHandler = {
    // ipcRenderer: {
    //     sendMessage(channel: Channels, ...args: unknown[]) {
    //         ipcRenderer.send(channel, ...args);
    //     },
    //     on(channel: Channels, func: (...args: unknown[]) => void) {
    //         const subscription = (
    //             _event: IpcRendererEvent,
    //             ...args: unknown[]
    //         ) => func(...args);
    //         ipcRenderer.on(channel, subscription);

    //         return () => {
    //             ipcRenderer.removeListener(channel, subscription);
    //         };
    //     },
    //     once(channel: Channels, func: (...args: unknown[]) => void) {
    //         ipcRenderer.once(channel, (_event, ...args) => func(...args));
    //     },
    // },
    invoke: ipcRenderer.invoke,
    onSystemThemeChange: (callback: () => void) => {
        ipcRenderer.on('native-theme-updated', callback)
        return () => ipcRenderer.off('native-theme-updated', callback)
    },
}

contextBridge.exposeInMainWorld('electronAPI', electronHandler)

export type ElectronHandler = typeof electronHandler
