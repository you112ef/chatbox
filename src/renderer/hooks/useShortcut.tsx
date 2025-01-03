import { useEffect } from 'react'
import platform from '../platform'
import * as dom from './dom'
import * as atoms from '../stores/atoms'
import * as sessionActions from '../stores/sessionActions'
import { useAtomValue, getDefaultStore } from 'jotai'
import { useIsSmallScreen } from './useScreenChange'
import { useHotkeys } from 'react-hotkeys-hook'

export default function useShortcut() {
    const shortcuts = useAtomValue(atoms.shortcutsAtom)
    const openSettingDialog = useAtomValue(atoms.openSettingDialogAtom)

    const isSmallScreen = useIsSmallScreen()
    // 大屏幕下，窗口显示时自动聚焦输入框
    useEffect(() => {
        const cancel = platform.onWindowShow(() => {
            if (!isSmallScreen) {
                dom.focusMessageInput()
            }
        })
        return () => {
            cancel()
        }
    }, [isSmallScreen])

    // mod (which listens for ctrl on Windows/Linux and cmd on macOS)
    // Since version 4 alt and option are identical. The meta key is the same as cmd on macOS and os key on Windows.
    // options 就是 alt

    // 聚焦输入框
    useHotkeys(shortcuts.inputBoxFocus, () => {
        dom.focusMessageInput()
    }, {
        enableOnFormTags: true,
        preventDefault: true,
        enabled: !openSettingDialog,
    })

    // 切换输入框的 web 浏览模式
    useHotkeys(shortcuts.inputBoxWebBrowsingMode, (event) => {
        dom.focusMessageInput()
        const store = getDefaultStore()
        store.set(atoms.inputBoxWebBrowsingModeAtom, (v) => !v)
    }, {
        enableOnFormTags: true,
        preventDefault: true,
        enabled: !openSettingDialog,
    })

    // 创建新会话
    useHotkeys(shortcuts.newChat, () => {
        sessionActions.createEmpty('chat')
    }, {
        enableOnFormTags: true,
        preventDefault: true,
        enabled: !openSettingDialog,
    })
    // 创建新图片会话
    useHotkeys(shortcuts.newPictureChat, () => {
        sessionActions.createEmpty('picture')
    }, {
        enableOnFormTags: true,
        preventDefault: true,
        enabled: !openSettingDialog,
    })

    // 归档当前会话的上下文
    useHotkeys(shortcuts.messageListRefreshContext, (event) => {
        event.preventDefault()
        sessionActions.startNewThread()
    }, {
        enableOnFormTags: true,
        preventDefault: true,
        enabled: !openSettingDialog,
    })

    // 会话导航
    useHotkeys(shortcuts.sessionListNavNext, (event) => {
        if (event.isComposing) {
            return // 使用输入法时不应该触发动作
        }
        sessionActions.switchToNext()
    }, {
        enableOnFormTags: true,
        preventDefault: true,
        enabled: !openSettingDialog,
    })
    useHotkeys(shortcuts.sessionListNavPrev, (event) => {
        if (event.isComposing) {
            return // 使用输入法时不应该触发动作
        }
        sessionActions.switchToNext(true)
    }, {
        enableOnFormTags: true,
        preventDefault: true,
        enabled: !openSettingDialog,
    })
    useHotkeys(
        shortcuts.sessionListNavTargetIndex && shortcuts.sessionListNavTargetIndex.length > 0
            ? [1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => `${shortcuts.sessionListNavTargetIndex}+${num}`)
            : [],
        (event, handler) => {
            if (event.isComposing) {
                return // 使用输入法时不应该触发动作
            }
            if (handler.keys === undefined) {
                return
            }
            const num = parseInt(handler.keys[0])
            if (num >= 1 && num <= 9) {
                sessionActions.switchToIndex(num - 1)
            }
        }, {
            enableOnFormTags: true,
            preventDefault: true,
            enabled: !openSettingDialog,
        })

    // 搜索
    useHotkeys(shortcuts.dialogOpenSearch, () => {
        const store = getDefaultStore()
        const openSearchDialog = store.get(atoms.openSearchDialogAtom)
        if (openSearchDialog) {
            store.set(atoms.openSearchDialogAtom, false)
        } else {
            store.set(atoms.openSearchDialogAtom, true)
        }
    }, {
        enableOnFormTags: true,
        preventDefault: true,
        enabled: !openSettingDialog,
    })
}
