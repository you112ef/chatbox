import { useEffect } from 'react'
import platform from '../platform'
import * as dom from './dom'
import * as atoms from '../stores/atoms'
import * as sessionActions from '../stores/sessionActions'
import { getDefaultStore } from 'jotai'
import { useIsSmallScreen } from './useScreenChange'

export default function useShortcut() {
    const isSmallScreen = useIsSmallScreen()
    useEffect(() => {
        const cancel = platform.onWindowShow(() => {
            // 大屏幕下，窗口显示时自动聚焦输入框
            if (!isSmallScreen) {
                dom.focusMessageInput()
            }
        })
        window.addEventListener('keydown', keyboardShortcut)
        return () => {
            cancel()
            window.removeEventListener('keydown', keyboardShortcut)
        }
    }, [isSmallScreen])
}

function keyboardShortcut(e: KeyboardEvent) {
    const ctrlOrCmd = e.ctrlKey || e.metaKey
    const shift = e.shiftKey
    const altOrOption = e.altKey

    if (e.key === 'i' && ctrlOrCmd) {
        dom.focusMessageInput()
        return
    }
    if (e.key === 'e' && ctrlOrCmd) {
        dom.focusMessageInput()
        const store = getDefaultStore()
        store.set(atoms.inputBoxWebBrowsingModeAtom, (v) => !v)
        return
    }

    // 创建新会话 CmdOrCtrl + C
    if (e.key === 'n' && ctrlOrCmd && !shift) {
        sessionActions.createEmpty('chat')
        return
    }
    // 创建新图片会话 CmdOrCtrl + Shift + C
    if (e.key === 'n' && ctrlOrCmd && shift) {
        sessionActions.createEmpty('picture')
        return
    }
    // 归档当前会话的上下文。
    // 这里不用 e.key 是因为 alt 和 option 会改变 e.key 的值
    if (e.code === 'KeyR' && altOrOption) {
        e.preventDefault()
        sessionActions.startNewThread()
        return
    }
    if (platform.type === 'desktop') {
        // 桌面版本中，CMD+R 也可以归档当前会话的上下文
        if (e.code === 'KeyR' && ctrlOrCmd) {
            e.preventDefault()
            sessionActions.startNewThread()
            return
        }
    }

    if (e.key === 'Tab' && ctrlOrCmd && !shift) {
        sessionActions.switchToNext()
    }
    if (e.key === 'Tab' && ctrlOrCmd && shift) {
        sessionActions.switchToNext(true)
    }
    for (let i = 1; i <= 9; i++) {
        if (e.key === i.toString() && ctrlOrCmd) {
            sessionActions.switchToIndex(i - 1)
        }
    }

    if (e.key === 'k' && ctrlOrCmd) {
        const store = getDefaultStore()
        const openSearchDialog = store.get(atoms.openSearchDialogAtom)
        if (openSearchDialog) {
            store.set(atoms.openSearchDialogAtom, false)
        } else {
            store.set(atoms.openSearchDialogAtom, true)
        }
    }
}
