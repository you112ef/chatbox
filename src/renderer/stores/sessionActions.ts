import { getDefaultStore } from 'jotai'
import { Settings, createMessage, Message, Session, getMsgDisplayModelName } from '../../shared/types'
import * as atoms from './atoms'
import * as client from '../packages/llm'
import * as promptFormat from '../packages/prompts'
import * as Sentry from '@sentry/react'
import * as utils from '../packages/utils'
import { v4 as uuidv4 } from 'uuid'
import * as defaults from './defaults'
import * as scrollActions from './scrollActions'
import * as storage from '../storage'

export function create(newSession: Session) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) => [...sessions, newSession])
    switchCurrentSession(newSession.id)
}

export function modify(update: Session) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === update.id) {
                return update
            }
            return s
        })
    )
}

export function modifyName(sessionId: string, name: string) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return { ...s, name }
            }
            return s
        })
    )
}

export function createEmpty() {
    create(getEmptySession())
}

export function switchCurrentSession(sessionId: string) {
    const store = getDefaultStore()
    store.set(atoms.currentSessionIdAtom, sessionId)
    scrollActions.scrollToBottom() // 切换会话时自动滚动到底部
    scrollActions.clearAutoScroll() // 切换会话时清除自动滚动

    // 小屏幕切换会话时隐藏侧边栏
    const isSmallScreen = store.get(atoms.isSmallScreenAtom)
    if (isSmallScreen) {
        store.set(atoms.showSidebarAtom, false)
    }
}

export function switchToIndex(index: number) {
    const store = getDefaultStore()
    const sessions = store.get(atoms.sortedSessionsAtom)
    const target = sessions[index]
    if (!target) {
        return
    }
    switchCurrentSession(target.id)
}

export function switchToNext(reversed?: boolean) {
    const store = getDefaultStore()
    const sessions = store.get(atoms.sortedSessionsAtom)
    const currentSessionId = store.get(atoms.currentSessionIdAtom)
    const currentIndex = sessions.findIndex((s) => s.id === currentSessionId)
    if (currentIndex < 0) {
        switchCurrentSession(sessions[0].id)
        return
    }
    let targetIndex = reversed ? currentIndex - 1 : currentIndex + 1
    if (targetIndex >= sessions.length) {
        targetIndex = 0
    }
    if (targetIndex < 0) {
        targetIndex = sessions.length - 1
    }
    const target = sessions[targetIndex]
    switchCurrentSession(target.id)
}

export function remove(session: Session) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) => sessions.filter((s) => s.id !== session.id))
}

export function clear(sessionId: string) {
    const store = getDefaultStore()
    const session = getSession(sessionId)
    if (!session) {
        return
    }
    modify({
        ...session,
        messages: session.messages.filter((m) => m.role === 'system'),
    })
}

export function copy(source: Session) {
    const store = getDefaultStore()
    const newSession = { ...source }
    newSession.id = getEmptySession().id
    store.set(atoms.sessionsAtom, (sessions) => [...sessions, newSession])
}

export function getSession(sessionId: string) {
    const store = getDefaultStore()
    const sessions = store.get(atoms.sessionsAtom)
    return sessions.find((s) => s.id === sessionId)
}

export function insertMessage(sessionId: string, msg: Message, index?: number) {
    const store = getDefaultStore()
    msg.wordCount = utils.countWord(msg.content)
    msg.tokenCount = utils.estimateTokensFromMessages([msg])
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                const newMessages = [...s.messages]
                if (index === undefined) {
                    newMessages.push(msg)
                } else {
                    newMessages.splice(index, 0, msg)
                }
                return {
                    ...s,
                    messages: newMessages,
                }
            }
            return s
        })
    )
}

export function modifyMessage(sessionId: string, updated: Message, refreshCounting?: boolean) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    messages: s.messages.map((m) => {
                        if (m.id === updated.id) {
                            if (refreshCounting) {
                                updated.wordCount = utils.countWord(updated.content)
                                updated.tokenCount = utils.estimateTokensFromMessages([updated])
                            }
                            return updated
                        }
                        return m
                    }),
                }
            }
            return s
        })
    )
}

export function removeMessage(sessionId: string, messageId: string) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    messages: s.messages.filter((m) => m.id !== messageId),
                }
            }
            return s
        })
    )
}

export async function generate(sessionId: string, targetMsg: Message) {
    const store = getDefaultStore()
    const globalSettings = store.get(atoms.settingsAtom)
    const session = getSession(sessionId)
    if (!session) {
        return
    }
    const settings = mergeSettings(globalSettings, session)
    const placeholder = '...'
    targetMsg = {
        ...targetMsg,
        content: placeholder,
        cancel: undefined,
        aiProvider: settings.aiProvider,
        model: getMsgDisplayModelName(settings),
        generating: true,
        error: undefined,
        errorExtra: undefined,
    }
    modifyMessage(sessionId, targetMsg)

    const targetMsgIx = session.messages.findIndex((m) => m.id === targetMsg.id)
    if (targetMsgIx < 0) {
        return
    }
    const promptMsgs = genMessageContext(settings, session.messages.slice(0, targetMsgIx))

    scrollActions.scrollToMessage(targetMsg.id, 'end')
    const autoScrollId = scrollActions.startAutoScroll(targetMsg.id, 'end', 'smooth')

    const configs = await storage.getConfig()
    try {
        await client.reply(settings, configs, promptMsgs, ({ text, cancel }) => {
            targetMsg = {
                ...targetMsg,
                content: text,
                cancel,
            }
            modifyMessage(sessionId, targetMsg)
        })
    } catch (err: any) {
        if (!(err instanceof Error)) {
            err = new Error(`${err}`)
        }
        if (!(err instanceof client.ApiError || err instanceof client.NetworkError)) {
            Sentry.captureException(err) // unexpected error should be reported
        }
        targetMsg = {
            ...targetMsg,
            content: targetMsg.content === placeholder ? '' : targetMsg.content,
            error: `${err.message}`, // 这么写是为了避免类型问题
            errorExtra: {
                aiProvider: settings.aiProvider,
                host: err['host'],
            },
        }
        modifyMessage(sessionId, targetMsg, true)
    }
    targetMsg = {
        ...targetMsg,
        generating: false,
        cancel: undefined,
        tokensUsed: utils.estimateTokensFromMessages([...promptMsgs, targetMsg]),
    }
    modifyMessage(sessionId, targetMsg, true)

    scrollActions.clearAutoScroll(autoScrollId)
}

export async function refreshMessage(sessionId: string, msg: Message) {
    if (msg.role === 'assistant') {
        await generate(sessionId, msg)
    } else {
        const session = getSession(sessionId)
        const ix = session?.messages.findIndex((m) => m.id === msg.id) ?? -1
        const newAssistantMsg = createMessage('assistant', '...')
        insertMessage(sessionId, newAssistantMsg, ix + 1)
        await generate(sessionId, newAssistantMsg)
    }
}

export async function generateName(sessionId: string) {
    const store = getDefaultStore()
    const globalSettings = store.get(atoms.settingsAtom)
    const session = getSession(sessionId)
    if (!session) {
        return
    }
    const settings = mergeSettings(globalSettings, session)
    const configs = await storage.getConfig()
    try {
        await client.reply(
            settings,
            configs,
            promptFormat.nameConversation(session.messages.slice(0, 3)),
            ({ text: name }) => {
                name = name.replace(/['"“”]/g, '')
                modifyName(session.id, name)
            }
        )
    } catch (e: any) {
        if (!(e instanceof client.ApiError || e instanceof client.NetworkError)) {
            Sentry.captureException(e) // unexpected error should be reported
        }
    }
}

/**
 * 清理会话列表，保留指定数量的会话
 * @param keepNum 保留的会话数量（顶部顺序）
 */
export function clearConversationList(keepNum: number) {
    const store = getDefaultStore()
    const keepSessionIds = store
        .get(atoms.sortedSessionsAtom)
        .slice(0, keepNum)
        .map((s) => s.id) // 这里必须用 id，因为使用写入 sorted 版本会改变顺序
    store.set(atoms.sessionsAtom, (sessions) => sessions.filter((s) => keepSessionIds.includes(s.id)))
}

/**
 * 从历史消息中生成 prompt 上下文
 */
function genMessageContext(settings: Settings, msgs: Message[]) {
    const { openaiMaxContextTokens, openaiMaxContextMessageCount } = settings
    if (msgs.length === 0) {
        throw new Error('No messages to replay')
    }
    const head = msgs[0].role === 'system' ? msgs[0] : undefined
    if (head) {
        msgs = msgs.slice(1)
    }
    let totalLen = head ? utils.estimateTokensFromMessages([head]) : 0
    let prompts: Message[] = []
    for (let i = msgs.length - 1; i >= 0; i--) {
        const msg = msgs[i]
        const size = utils.estimateTokensFromMessages([msg]) + 20 // 20 作为预估的误差补偿
        // 只有 OpenAI 才支持上下文 tokens 数量限制
        if (settings.aiProvider === 'openai') {
            if (size + totalLen > openaiMaxContextTokens) {
                break
            }
        }
        if (
            openaiMaxContextMessageCount <= 20 && // 超过20表示不再限制
            prompts.length >= openaiMaxContextMessageCount + 1 // +1是为了保留用户最后一条输入消息
        ) {
            break
        }
        prompts = [msg, ...prompts]
        totalLen += size
    }
    if (head) {
        prompts = [head, ...prompts]
    }
    return prompts
}

export function getEmptySession(name: string = 'Untitled'): Session {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    return {
        id: uuidv4(),
        name: name,
        messages: [
            {
                id: uuidv4(),
                role: 'system',
                content: settings.defaultPrompt || defaults.getDefaultPrompt(),
            },
        ],
    }
}

function mergeSettings(globalSettings: Settings, session: Session): Settings {
    return {
        ...globalSettings,
        ...omit(session.settings || {}), // 需要 omit 来去除 undefined，否则会覆盖掉全局配置
    } // 会话配置优先级高于全局配置
}

function omit(obj: any) {
    const ret = { ...obj }
    for (const key of Object.keys(ret)) {
        if (ret[key] === undefined) {
            delete ret[key]
        }
    }
    return ret
}
