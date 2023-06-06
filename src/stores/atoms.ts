import { atom, useAtom, SetStateAction } from 'jotai'
import { Session, getEmptySession, Toast, Settings, Config, CopilotDetail } from '../types'
import { selectAtom, splitAtom, atomWithStorage } from 'jotai/utils'
import { focusAtom } from 'jotai-optics'
import * as defaults from './defaults'
import storage from '../storage'

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
    },
)

export const languageAtom = focusAtom(settingsAtom, (optic) => optic.prop('language'))
export const showWordCountAtom = focusAtom(settingsAtom, (optic) => optic.prop('showWordCount'))
export const showTokenCountAtom = focusAtom(settingsAtom, (optic) => optic.prop('showTokenCount'))
export const showModelNameAtom = focusAtom(settingsAtom, (optic) => optic.prop('showModelName'))
export const themeAtom = focusAtom(settingsAtom, (optic) => optic.prop('theme'))
export const fontSizeAtom = focusAtom(settingsAtom, (optic) => optic.prop('fontSize'))

// configs

export const configsAtom = atomWithStorage<Config>('configs', defaults.configs(), storage)

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
            sessions = [getEmptySession()]
        }
        return sessions
    },
    (get, set, update: SetStateAction<Session[]>) => {
        const sessions = get(_sessionsAtom)
        let newSessions = typeof update === 'function' ? update(sessions) : update
        if (newSessions.length === 0) {
            newSessions = [getEmptySession()]
        }
        set(_sessionsAtom, newSessions)
    },
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

const currentSessionMarkAtom = atom<string | null>(null) // 不对外暴露，属于内部状态
export const currentSessionAtom = atom((get) => {
    const sessionMark = get(currentSessionMarkAtom)
    const sessions = get(sessionsAtom)
    let current = sessions.find((session) => session.id === sessionMark)
    if (! current) {
        return sessions[sessions.length - 1] // 当前会话不存在时，返回最后一个会话
    }
    return current
}, (_get, set, update: Session) => {
    set(sessionsAtom, (sessions) => {
        const index = sessions.findIndex((session) => session.id === update.id)
        if (index === -1) {
            return [...sessions, update]
        }
        const newSessions = [...sessions]
        newSessions[index] = update
        return newSessions
    })
    set(currentSessionMarkAtom, update.id)
})
export const currentSessionNameAtom = focusAtom(currentSessionAtom, (optic) => optic.prop('name'))
export const currentMessagesAtom = focusAtom(
    currentSessionAtom,
    (optic) => optic.prop('messages').valueOr([]),
)
export const currentMessageAtomsAtom = splitAtom(currentMessagesAtom)

export const currsentSessionPicUrlAtom = focusAtom(currentSessionAtom, (optic) => optic.prop('picUrl'))

// toasts

export const toastsAtom = atom<Toast[]>([])

// quote 消息引用

export const quoteAtom = atom<string>('')

// theme

export const realThemeAtom = atom<'light' | 'dark'>('light')
