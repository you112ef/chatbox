import { useEffect } from 'react'
import * as api from '../api'
import * as dom from './dom'
import * as sessionActions from '../stores/sessionActions'

export default function useShortcut() {
    useEffect(() => {
        api.onWindowShow(() => {
            dom.focusMessageInput()
        })

        window.addEventListener('keydown', keyboardShortcut)
        return () => {
            window.removeEventListener('keydown', keyboardShortcut)
        }

    }, [])
}

function keyboardShortcut(e: KeyboardEvent) {
    const ctrlOrCmd = e.ctrlKey || e.metaKey
    const shift = e.shiftKey
    if (e.key === 'i' && ctrlOrCmd) {
        dom.focusMessageInput()
    }
    if (e.key === 'n' && ctrlOrCmd) {
        sessionActions.createEmpty()
    }
    if (e.key === 'Tab' && ctrlOrCmd && !shift) {
        sessionActions.switchToNext()
    }
    if (e.key === 'Tab' && ctrlOrCmd && shift) {
        sessionActions.switchToNext(true)
    }
    for (let i = 1; i <= 9; i ++) {
        if (e.key === i.toString() && ctrlOrCmd) {
            sessionActions.switchToIndex(i - 1)
        }
    }
}
