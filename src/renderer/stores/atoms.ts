import { RefObject } from 'react'
import { atom, SetStateAction } from 'jotai'
import { Session, Toast, Settings, Config, CopilotDetail } from '../../shared/types'
import { selectAtom, atomWithStorage } from 'jotai/utils'
import { focusAtom } from 'jotai-optics'
import * as defaults from './defaults'
import { v4 as uuidv4 } from 'uuid'
import storage from '../storage'
import { VirtuosoHandle } from 'react-virtuoso'

// settings

const _settingsAtom = atomWithStorage<Settings>('settings', defaults.settings(), storage)
export const settingsAtom = atom(
    (get) => {
        const settings = get(_settingsAtom)
        return Object.assign({}, defaults.settings(), settings) // 兼容早期版本
    },
    (get, set, update: SetStateAction<Settings>) => {
        const settings = get(_settingsAtom)
        const newSettings = typeof update === 'function' ? update(settings) : update
        // 考虑关键配置的缺省情况
        if (!newSettings.apiHost) {
            newSettings.apiHost = defaults.settings().apiHost
        }
        set(_settingsAtom, newSettings)
    }
)

export const languageAtom = focusAtom(settingsAtom, (optic) => optic.prop('language'))
export const showWordCountAtom = focusAtom(settingsAtom, (optic) => optic.prop('showWordCount'))
export const showTokenCountAtom = focusAtom(settingsAtom, (optic) => optic.prop('showTokenCount'))
export const showTokenUsedAtom = focusAtom(settingsAtom, (optic) => optic.prop('showTokenUsed'))
export const showModelNameAtom = focusAtom(settingsAtom, (optic) => optic.prop('showModelName'))
export const themeAtom = focusAtom(settingsAtom, (optic) => optic.prop('theme'))
export const fontSizeAtom = focusAtom(settingsAtom, (optic) => optic.prop('fontSize'))

// myCopilots
export const myCopilotsAtom = atomWithStorage<CopilotDetail[]>('myCopilots', [], storage)

// sessions

// _sessionsAtom 内部状态，不对外暴露
const _sessionsAtom = atomWithStorage<Session[]>('chat-sessions', [], storage)
// sessionsAtom 会话列表，保证至少有一个会话
export const sessionsAtom = atom(
    (get) => {
        let sessions = get(_sessionsAtom)
        if (sessions.length === 0) {
            sessions = [{ id: uuidv4(), name: 'Untitled', messages: [] }]
        }
        return sessions
    },
    (get, set, update: SetStateAction<Session[]>) => {
        const sessions = get(_sessionsAtom)
        let newSessions = typeof update === 'function' ? update(sessions) : update
        if (newSessions.length === 0) {
            newSessions = [{ id: uuidv4(), name: 'Untitled', messages: [] }]
        }
        set(_sessionsAtom, newSessions)
    }
)
export const sortedSessionsAtom = atom((get) => {
    return sortSessions(get(sessionsAtom))
})

export function sortSessions(sessions: Session[]): Session[] {
    let reversed: Session[] = []
    let pinned: Session[] = []
    for (const sess of sessions) {
        if (sess.starred) {
            pinned.push(sess)
            continue
        }
        reversed.unshift(sess)
    }
    return pinned.concat(reversed)
}

// current session and messages

const _currentSessionIdCachedAtom = atom<string | null>(null) // 不对外暴露，属于内部状态
export const currentSessionIdAtom = atom(
    (get) => {
        const idCached = get(_currentSessionIdCachedAtom)
        const sessions = get(sessionsAtom)
        if (sessions.some((session) => session.id === idCached)) {
            return idCached
        }
        return sessions[sessions.length - 1].id // 当前会话不存在时，返回最后一个会话
    },
    (_get, set, update: string) => {
        set(_currentSessionIdCachedAtom, update)
    }
)

export const currentSessionAtom = atom((get) => {
    const id = get(currentSessionIdAtom)
    const sessions = get(sessionsAtom)
    let current = sessions.find((session) => session.id === id)
    if (!current) {
        return sessions[sessions.length - 1] // 当前会话不存在时，返回最后一个会话
    }
    return current
})

export const currentSessionNameAtom = selectAtom(currentSessionAtom, (s) => s.name)
export const currentMessagesAtom = selectAtom(currentSessionAtom, (s) => s.messages || [])
export const currsentSessionPicUrlAtom = selectAtom(currentSessionAtom, (s) => s.picUrl)

// toasts

export const toastsAtom = atom<Toast[]>([])

// quote 消息引用

export const quoteAtom = atom<string>('')

// theme

export const realThemeAtom = atom<'light' | 'dark'>('light')

// configVersion 配置版本，用于判断是否需要升级迁移配置（migration）
export const configVersionAtom = atomWithStorage<number>('configVersion', 0, storage)

// message scrolling

export const messageScrollingAtom = atom<null | RefObject<VirtuosoHandle>>(null)
export const messageScrollingAtTopAtom = atom(false)
export const messageScrollingAtBottomAtom = atom(false)
export const messageScrollingAutoMarkAtom = atom('') // 判断是否允许自动滚动，值为自动滚动任务随机ID
