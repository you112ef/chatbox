import { MutableRefObject } from 'react'
import { getDefaultStore } from 'jotai'
import { createMessage, Message, Session, getEmptySession, getMsgDisplayModelName, aiProviderNameHash } from '../types'
import * as atoms from './atoms'
import * as client from '../client'
import * as promptFormat from '../prompts'
import * as Sentry from '@sentry/react'
import * as utils from '../utils'

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

export function createEmptyThenSwitch() {
    const store = getDefaultStore()
    const session = getEmptySession()
    store.set(atoms.currentSessionAtom, session)
}

export function remove(session: Session) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) => sessions.filter((s) => s.id !== session.id))
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

export async function generate(
    sessionId: string,
    targetMsg: Message,
    messageScrollRef: MutableRefObject<{
        msgId: string
        smooth?: boolean | undefined
    } | null>
) {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    const configs = store.get(atoms.configsAtom)
    const session = getSession(sessionId)
    if (!session) {
        return
    }
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

    const msgIx = session.messages.findIndex((m) => m.id === targetMsg.id)
    if (msgIx < 0) {
        return
    }
    const promptMsgs = genMessageContext(
        session.messages.slice(0, msgIx),
        settings.openaiMaxContextTokens,
    )

    messageScrollRef.current = { msgId: targetMsg.id, smooth: false }

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
                'aiProvider': settings.aiProvider,
                'host': err['host']
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

    messageScrollRef.current = null
}

export async function refreshMessage(
    sessionId: string,
    msg: Message,
    messageScrollRef: MutableRefObject<{
        msgId: string
        smooth?: boolean | undefined
    } | null>
) {
    if (msg.role === 'assistant') {
        await generate(sessionId, msg, messageScrollRef)
    } else {
        const session = getSession(sessionId)
        const ix = session?.messages.findIndex((m) => m.id === msg.id) ?? -1
        const newAssistantMsg = createMessage('assistant', '...')
        insertMessage(sessionId, newAssistantMsg, ix + 1)
        messageScrollRef.current = { msgId: newAssistantMsg.id, smooth: true }
        await generate(sessionId, newAssistantMsg, messageScrollRef)
    }
}

export async function generateName(sessionId: string) {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    const configs = store.get(atoms.configsAtom)
    const session = getSession(sessionId)
    if (!session) {
        return
    }
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
    const keepSessionIds = store.get(atoms.sortedSessionsAtom)
        .slice(0, keepNum)
        .map(s => s.id) // 这里必须用 id，因为使用写入 sorted 版本会改变顺序
    store.set(atoms.sessionsAtom, (sessions) => sessions.filter(s => keepSessionIds.includes(s.id)))
}

/**
 * 从历史消息中生成 prompt 上下文
 */
function genMessageContext(msgs: Message[], openaiMaxContextTokens: number) {
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
        if (size + totalLen > openaiMaxContextTokens) {
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
