import { getDefaultStore } from 'jotai'
import {
    Settings,
    createMessage,
    Message,
    Session,
    settings2SessionSettings,
    pickPictureSettings,
    ModelSettings,
    MessagePicture,
    SessionThread,
    MessageFile,
    ModelProvider,
    ExportChatScope,
    ExportChatFormat,
} from '../../shared/types'
import * as atoms from './atoms'
import * as promptFormat from '../packages/prompts'
import * as Sentry from '@sentry/react'
import { v4 as uuidv4 } from 'uuid'
import * as defaults from '../../shared/defaults'
import * as scrollActions from './scrollActions'
import storage from '../storage'
import i18n from '../i18n'
import { getModel, getModelDisplayName, isCurrentModelSupportImageInput } from '@/packages/models'
import { AIProviderNoImplementedPaintError, NetworkError, ApiError, BaseError, ChatboxAIAPIError } from '@/packages/models/errors'
import platform from '../platform'
import * as dom from '@/hooks/dom'
import * as remote from '@/packages/remote'
import { throttle } from 'lodash'
import * as settingActions from './settingActions'
import { formatChatAsHtml, formatChatAsMarkdown, formatChatAsTxt } from "@/lib/format-chat";
import { countWord } from '@/packages/word-count'
import { estimateTokensFromMessages } from '@/packages/token'

/**
 * 创建一个新的会话
 * @param newSession
 */
export function create(newSession: Session) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) => [...sessions, newSession])
    switchCurrentSession(newSession.id)
}

/**
 * 修改会话，根据 id 匹配
 */
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

/**
 * 修改会话名称
 */
export function modifyNameAndThreadName(sessionId: string, name: string) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return { ...s, name, threadName: name }
            }
            return s
        })
    )
}

/**
 * 修改会话的当前话题名称
 */
export function modifyThreadName(sessionId: string, threadName: string) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return { ...s, threadName }
            }
            return s
        })
    )
}

/**
 * 创建一个空的会话
 */
export function createEmpty(type: 'chat' | 'picture') {
    switch (type) {
        case 'chat':
            return create(initEmptyChatSession())
        case 'picture':
            return create(initEmptyPictureSession())
        default:
            throw new Error(`Unknown session type: ${type}`)
    }
}

/**
 * 创建 n 个空图片消息（loading 中，用于占位）
 * @param n 空消息数量
 * @returns 
 */
export function createLoadingPictures(n: number): MessagePicture[] {
    const ret: MessagePicture[] = []
    for (let i = 0; i < n; i++) {
        ret.push({ loading: true })
    }
    return ret
}

/**
 * 切换当前会话，根据 id
 * @param sessionId
 */
export function switchCurrentSession(sessionId: string) {
    const store = getDefaultStore()
    store.set(atoms.currentSessionIdAtom, sessionId)
    scrollActions.scrollToBottom() // 切换会话时自动滚动到底部
    scrollActions.clearAutoScroll() // 切换会话时清除自动滚动
}

/**
 * 切换当前会话，根据排序后的索引
 * @param index 
 * @returns 
 */
export function switchToIndex(index: number) {
    const store = getDefaultStore()
    const sessions = store.get(atoms.sortedSessionsAtom)
    const target = sessions[index]
    if (!target) {
        return
    }
    switchCurrentSession(target.id)
}

/**
 * 将当前会话切换到下一个，根据排序后到会话列表顺序
 * @param reversed 是否反向切换到上一个
 * @returns 
 */
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

/**
 * 删除会话，根据 id
 * @param session 
 */
export function remove(session: Session) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) => sessions.filter((s) => s.id !== session.id))
}

/**
 * 删除历史话题
 * @param sessionId 会话 id
 * @param threadId 历史话题 id
 */
export function removeThread(sessionId: string, threadId: string) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) => sessions.map((s) => {
        if (s.id === sessionId && s.threads) {
            s = {
                ...s,
                threads: s.threads.filter((t) => t.id !== threadId)
            }
        }
        return s
    }))
}

/**
 * 清空会话中的所有消息，仅保留 system prompt
 * @param sessionId
 * @returns 
 */
export function clear(sessionId: string) {
    const store = getDefaultStore()
    const session = getSession(sessionId)
    if (!session) {
        return
    }
    modify({
        ...session,
        messages: session.messages.filter((m) => m.role === 'system'),
        threads: undefined,
    })
}

/**
 * 复制会话
 * @param source
 */
export async function copy(source: Session) {
    const store = getDefaultStore()
    const newSession = { ...source }
    newSession.id = uuidv4()
    store.set(atoms.sessionsAtom, (sessions) => {
        let originIndex = sessions.findIndex((s) => s.id === source.id)
        if (originIndex < 0) {
            originIndex = 0
        }
        const newSessions = [...sessions]
        newSessions.splice(originIndex + 1, 0, newSession)
        return newSessions
    })
}

/**
 * 根据 id 获取会话的最新数据，一般用于无需监听会话变化的场景下查询数据
 * @param sessionId
 * @returns 
 */
export function getSession(sessionId: string) {
    const store = getDefaultStore()
    const sessions = store.get(atoms.sessionsAtom)
    return sessions.find((s) => s.id === sessionId)
}

/**
 * 将会话中的当前消息移动到历史记录中，并清空上下文
 * @param sessionId
 */
export function refreshContextAndCreateNewThread(sessionId: string) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) => {
        return sessions.map(s => {
            if (s.id !== sessionId) {
                return s
            }
            for (const m of s.messages) {
                m?.cancel?.()
            }
            const newThread: SessionThread = {
                id: uuidv4(),
                name: s.threadName || s.name,
                messages: s.messages,
                createdAt: Date.now(),
            }
            let systemPrompt = s.messages.find((m) => m.role === 'system')
            if (systemPrompt) {
                systemPrompt = createMessage('system', systemPrompt.content)
            }
            return {
                ...s,
                threads: s.threads ? [...s.threads, newThread] : [newThread],
                messages: systemPrompt
                    ? [systemPrompt]
                    : [createMessage('system', defaults.getDefaultPrompt())],
                threadName: '',
            }
        })
    })
}

export function startNewThread() {
    const store = getDefaultStore()
    const sessionId = store.get(atoms.currentSessionIdAtom)
    refreshContextAndCreateNewThread(sessionId)
    // 自动滚动到底部并自动聚焦到输入框
    setTimeout(() => {
        scrollActions.scrollToBottom()
        dom.focusMessageInput()
    }, 100);
}

/**
 * 切换到历史记录中的某个上下文，原有上下文存储到历史记录中
 * @param sessionId 
 * @param threadId 
 */
export function switchThread(sessionId: string, threadId: string) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) => {
        return sessions.map(s => {
            if (s.id !== sessionId) {
                return s
            }
            if (!s.threads) {
                return s
            }
            const target = s.threads.find(h => h.id === threadId)
            if (!target) {
                return s
            }
            for (const m of s.messages) {
                m?.cancel?.()
            }
            const newThreads = s.threads.filter(h => h.id !== threadId)
            newThreads.push({
                id: uuidv4(),
                name: s.threadName || s.name,
                messages: s.messages,
                createdAt: Date.now(),
            })
            return {
                ...s,
                threads: newThreads,
                messages: target.messages,
                threadName: target.name,
            }
        })
    })
    setTimeout(() => scrollActions.scrollToBottom(), 300)
}

/**
 * 删除某个会话的当前话题。如果该会话存在历史话题，则会回退到上一个话题；如果该会话没有历史话题，则会清空当前会话
 * @param sessionId
 */
export function removeCurrentThread(sessionId: string) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) => {
        return sessions.map(s => {
            if (s.id !== sessionId) {
                return s
            }
            const newSession: Session = {
                ...s,
                messages: s.messages.filter(m => m.role === 'system').slice(0, 1),  // 仅保留一条系统提示
                threadName: undefined,
            }
            if (s.threads && s.threads.length > 0) {
                const last = s.threads[s.threads.length - 1]
                newSession.messages = last.messages
                newSession.threadName = last.name
                newSession.threads = s.threads.slice(0, s.threads.length - 1)
            }
            return newSession
        })
    })
}

/**
 * 在当前主题的最后插入一条消息。
 * @param sessionId 
 * @param msg 
 */
export function insertMessage(sessionId: string, msg: Message) {
    const store = getDefaultStore()
    msg.wordCount = countWord(msg.content)
    msg.tokenCount = estimateTokensFromMessages([msg])
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                const newMessages = [...s.messages]
                newMessages.push(msg)
                return {
                    ...s,
                    messages: newMessages,
                }
            }
            return s
        })
    )
}

/**
 * 在某条消息后面插入新消息。如果消息在历史主题中，也能支持插入
 * @param sessionId 
 * @param msg 
 * @param afterMsgId 
 */
export function insertMessageAfter(sessionId: string, msg: Message, afterMsgId: string) {
    const store = getDefaultStore()
    msg.wordCount = countWord(msg.content)
    msg.tokenCount = estimateTokensFromMessages([msg])
    let hasHandled = false
    const handle = (msgs: Message[]) => {
        const index = msgs.findIndex((m) => m.id === afterMsgId)
        if (index < 0) {
            return msgs
        }
        hasHandled = true
        const newMessages = [...msgs]
        newMessages.splice(index + 1, 0, msg)
        return newMessages
    }
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id !== sessionId) {
                return s
            }
            s.messages = handle(s.messages)
            if (s.threads && !hasHandled) {
                s.threads = s.threads.map(h => {
                    h.messages = handle(h.messages)
                    return h
                })
            }
            return { ...s }
        })
    )
}

/**
 * 根据 id 修改消息。如果消息在历史主题中，也能支持修改
 * @param sessionId 
 * @param updated 
 * @param refreshCounting 
 */
export function modifyMessage(sessionId: string, updated: Message, refreshCounting?: boolean) {
    const store = getDefaultStore()
    if (refreshCounting) {
        updated.wordCount = countWord(updated.content)
        updated.tokenCount = estimateTokensFromMessages([updated])
    }

    // 更新消息时间戳
    updated.timestamp = new Date().getTime()

    let hasHandled = false
    const handle = (msgs: Message[]) => {
        return msgs.map((m) => {
            if (m.id === updated.id) {
                hasHandled = true
                return { ...updated }
            }
            return m
        })
    }
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id !== sessionId) {
                return s
            }
            s.messages = handle(s.messages)
            if (s.threads && !hasHandled) {
                s.threads = s.threads.map(h => {
                    h.messages = handle(h.messages)
                    return h
                })
            }
            return { ...s }
        })
    )
}

/**
 * 在会话中删除消息。如果消息存在于历史主题中，也能支持删除
 * @param sessionId 
 * @param messageId 
 */
export function removeMessage(sessionId: string, messageId: string) {
    const store = getDefaultStore()
    store.set(atoms.sessionsAtom, (sessions) => {
        let newSessions = sessions.map((s) => {
            if (s.id !== sessionId) {
                return s
            }
            s.messages = s.messages.filter((m) => m.id !== messageId)
            if (s.threads) {
                s.threads = s.threads.map(h => ({
                    ...h,
                    messages: h.messages.filter((m) => m.id !== messageId)
                }))
                s.threads = s.threads.filter(h => h.messages.length > 0)
            }
            return { ...s }
        })
        // 如果某个对话的消息为空，尽量使用上一个话题的消息
        newSessions = newSessions.map(s => {
            if (s.messages && s.messages.length > 0) {
                return s
            }
            if (!s.threads || s.threads.length === 0) {
                return s
            }
            const lastThread = s.threads[s.threads.length - 1]
            s.messages = lastThread.messages
            s.threads = s.threads.slice(0, s.threads.length - 1)
            return { ...s }
        })
        return newSessions
    })
}

/**
 * 在会话中发送新用户消息，并根据需要生成回复
 * @param params
 */
export async function submitNewUserMessage(params: {
    currentSessionId: string
    newUserMsg: Message
    needGenerating: boolean
    attachments: File[]
}) {
    const { currentSessionId, newUserMsg, needGenerating, attachments } = params
    // 如果存在附件，现在发送消息中构建空白的文件信息，用于占位，等待上传完成后再修改
    if (attachments && attachments.length > 0) {
        newUserMsg.files = attachments.map((f, ix) => ({
            id: ix.toString(),
            name: f.name,
            fileType: f.type,
        }))
    }
    // 先在聊天列表中插入发送的用户消息
    insertMessage(currentSessionId, newUserMsg)
    // 根据需要，插入空白的回复消息
    let newAssistantMsg = createMessage('assistant', '')
    if (attachments && attachments.length > 0) {
        newAssistantMsg.status = [{ type: 'sending_file' }]
    }
    if (needGenerating) {
        newAssistantMsg.generating = true
        insertMessage(currentSessionId, newAssistantMsg)
    }
    const settings = getCurrentSessionMergedSettings()
    try {
        const remoteConfig = settingActions.getRemoteConfig()
        // 如果本次发送消息携带了图片，检查当前模型是否支持
        if (newUserMsg.pictures && newUserMsg.pictures.length > 0) {
            if (!isCurrentModelSupportImageInput(settings)) {
                // 根据当前 IP，判断是否在错误中推荐 Chatbox AI 4
                if (remoteConfig.setting_chatboxai_first) {
                    throw ChatboxAIAPIError.fromCodeName('model_not_support_image', 'model_not_support_image')
                } else {
                    throw ChatboxAIAPIError.fromCodeName('model_not_support_image', 'model_not_support_image_2')
                }
            }
        }
        // 如果本次发送消息携带了附件，应该在这次发送中上传文件并构造文件信息(file uuid)
        if (attachments && attachments.length > 0) {
            const licenseKey = settingActions.getLicenseKey()
            // 检查模型。当前仅支持 Chatbox AI 4
            if (settings.aiProvider !== ModelProvider.ChatboxAI) {
                // 根据当前 IP，判断是否在错误中推荐 Chatbox AI 4
                if (remoteConfig.setting_chatboxai_first) {
                    throw ChatboxAIAPIError.fromCodeName('model_not_support_file', 'model_not_support_file')
                } else {
                    throw ChatboxAIAPIError.fromCodeName('model_not_support_file', 'model_not_support_file_2')
                }
            }
            // 上传文件
            const newFiles: MessageFile[] = []
            for (const attachment of (attachments || [])) {
                const fileUUID = await remote.uploadAndCreateUserFile(licenseKey || '', attachment)
                newFiles.push({
                    id: fileUUID,
                    name: attachment.name,
                    fileType: attachment.type,
                    chatboxAIFileUUID: fileUUID,
                })
            }
            modifyMessage(currentSessionId, { ...newUserMsg, files: newFiles }, false)
        }
    } catch (err: any) {
        // 如果文件上传失败，一定会出现带有错误信息的回复消息
        if (!(err instanceof Error)) {
            err = new Error(`${err}`)
        }
        if (!(err instanceof ApiError || err instanceof NetworkError || err instanceof AIProviderNoImplementedPaintError)) {
            Sentry.captureException(err) // unexpected error should be reported
        }
        let errorCode: number | undefined = undefined
        if (err instanceof BaseError) {
            errorCode = err.code
        }
        newAssistantMsg = {
            ...newAssistantMsg,
            generating: false,
            cancel: undefined,
            model: getModelDisplayName(settings, 'chat'),
            content: '',
            errorCode,
            error: `${err.message}`, // 这么写是为了避免类型问题
            status: [],
        }
        if (needGenerating) {
            modifyMessage(currentSessionId, newAssistantMsg)
        } else {
            insertMessage(currentSessionId, newAssistantMsg)
        }
        return  // 文件上传失败，不再继续生成回复
    }
    // 根据需要，生成这条回复消息
    if (needGenerating) {
        return generate(currentSessionId, newAssistantMsg)
    }
}

/**
 * 执行消息生成，会修改消息的状态
 * @param sessionId
 * @param targetMsg
 * @returns 
 */
export async function generate(sessionId: string, targetMsg: Message) {
    // 获得依赖的数据
    const store = getDefaultStore()
    const globalSettings = store.get(atoms.settingsAtom)
    const configs = await platform.getConfig()
    const session = getSession(sessionId)
    if (!session) {
        return
    }
    const settings = session.settings
        ? mergeSettings(globalSettings, session.settings, session.type)
        : globalSettings

    // 将消息的状态修改成初始状态
    const placeholder = session.type === 'picture' ? `[${i18n.t('Please wait about 20 seconds')}]` : '...'
    targetMsg = {
        ...targetMsg,
        content: placeholder,
        pictures: session.type === 'picture'
            ? createLoadingPictures(settings.imageGenerateNum)
            : targetMsg.pictures,
        cancel: undefined,
        aiProvider: settings.aiProvider,
        model: getModelDisplayName(settings, session.type || 'chat'),
        style: session.type === 'picture' ? settings.dalleStyle : undefined,
        generating: true,
        errorCode: undefined,
        error: undefined,
        errorExtra: undefined,
        status: [],
    }
    modifyMessage(sessionId, targetMsg)
    setTimeout(() => {
        scrollActions.scrollToMessage(targetMsg.id, 'end')
    }, 50) // 等待消息渲染完成后再滚动到底部，否则会出现滚动不到底部的问题

    // 获取目标消息所在的消息列表（可能是历史消息），获取目标消息的索引
    let messages = session.messages
    let targetMsgIx = messages.findIndex((m) => m.id === targetMsg.id)
    if (targetMsgIx <= 0) {
        if (!session.threads) {
            return
        }
        for (const t of session.threads) {
            messages = t.messages
            targetMsgIx = messages.findIndex((m) => m.id === targetMsg.id)
            if (targetMsgIx > 0) {
                break
            }
        }
        if (targetMsgIx <= 0) {
            return
        }
    }

    try {
        const model = getModel(settings, configs)
        switch (session.type) {
            // 对话消息生成
            case 'chat':
            case undefined:
                const promptMsgs = genMessageContext(settings, messages.slice(0, targetMsgIx))
                const throttledModifyMessage = throttle(({ text, cancel }: { text: string, cancel: () => void }) => {
                    targetMsg = { ...targetMsg, content: text, cancel }
                    modifyMessage(sessionId, targetMsg)
                }, 100)
                await model.chat(promptMsgs, throttledModifyMessage)
                targetMsg = {
                    ...targetMsg,
                    generating: false,
                    cancel: undefined,
                    tokensUsed: estimateTokensFromMessages([...promptMsgs, targetMsg]),
                }
                modifyMessage(sessionId, targetMsg, true)
                break
            // 图片消息生成
            case 'picture':
                // 取当前消息之前最近的一条用户消息作为 prompt
                let prompt = ''
                for (let i = targetMsgIx; i >= 0; i--) {
                    if (messages[i].role === 'user') {
                        prompt = messages[i].content
                        break
                    }
                }
                await model.paint(prompt, settings.imageGenerateNum, async (picBase64) => {
                    const storageKey = `picture:${sessionId}:${targetMsg.id}:${uuidv4()}`
                    // 图片需要存储到 indexedDB，如果直接使用 OpenAI 返回的图片链接，图片链接将随着时间而失效
                    await storage.setBlob(storageKey, picBase64)

                    const newPictures = targetMsg.pictures ? [...targetMsg.pictures] : []
                    const loadingIndex = newPictures.findIndex((p) => p.loading)
                    if (loadingIndex >= 0) {
                        newPictures[loadingIndex] = { storageKey }
                    }
                    targetMsg = {
                        ...targetMsg,
                        pictures: newPictures,
                    }
                    modifyMessage(sessionId, targetMsg, true)
                })
                targetMsg = {
                    ...targetMsg,
                    content: '',
                    generating: false,
                    cancel: undefined,
                }
                modifyMessage(sessionId, targetMsg, true)
                break
            default:
                throw new Error(`Unknown session type: ${session.type}, generate failed`)
        }
    } catch (err: any) {
        if (!(err instanceof Error)) {
            err = new Error(`${err}`)
        }
        if (!(err instanceof ApiError || err instanceof NetworkError || err instanceof AIProviderNoImplementedPaintError)) {
            Sentry.captureException(err) // unexpected error should be reported
        }
        let errorCode: number | undefined = undefined
        if (err instanceof BaseError) {
            errorCode = err.code
        }
        targetMsg = {
            ...targetMsg,
            generating: false,
            cancel: undefined,
            content: targetMsg.content === placeholder ? '' : targetMsg.content,
            errorCode,
            error: `${err.message}`, // 这么写是为了避免类型问题
            errorExtra: {
                aiProvider: settings.aiProvider,
                host: err['host'],
            },
            status: [],
        }
        modifyMessage(sessionId, targetMsg, true)
    }
}

export async function refreshMessage(sessionId: string, msg: Message, alwayInsertNew = false) {
    if (msg.role === 'assistant' && !alwayInsertNew) {
        await generate(sessionId, msg)
    } else {
        const newAssistantMsg = createMessage('assistant', '...')
        insertMessageAfter(sessionId, newAssistantMsg, msg.id)
        await generate(sessionId, newAssistantMsg)
    }
}

async function _generateName(sessionId: string, modifyName: (sessionId: string, name: string) => void) {
    const store = getDefaultStore()
    const globalSettings = store.get(atoms.settingsAtom)
    const session = getSession(sessionId)
    if (!session) {
        return
    }
    const settings = session.settings
        ? mergeSettings(globalSettings, session.settings, session.type)
        : globalSettings
    const configs = await platform.getConfig()
    try {
        const model = getModel(settings, configs)
        let name = await model.chat(promptFormat.nameConversation(
            session.messages.filter(m => m.role !== 'system')
                .slice(0, 4))
        )
        name = name.replace(/['"“”]/g, '')
        name = name.slice(0, 10)    // 限制名字长度
        modifyName(session.id, name)
    } catch (e: any) {
        if (!(e instanceof ApiError || e instanceof NetworkError)) {
            Sentry.captureException(e) // unexpected error should be reported
        }
    }
}

export async function generateNameAndThreadName(sessionId: string) {
    return _generateName(sessionId, modifyNameAndThreadName)
}

export async function generateThreadName(sessionId: string) {
    return _generateName(sessionId, modifyThreadName)
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
    const {
        // openaiMaxContextTokens,
        openaiMaxContextMessageCount
    } = settings
    if (msgs.length === 0) {
        throw new Error('No messages to replay')
    }
    const head = msgs[0].role === 'system' ? msgs[0] : undefined
    if (head) {
        msgs = msgs.slice(1)
    }
    let totalLen = head ? estimateTokensFromMessages([head]) : 0
    let prompts: Message[] = []
    for (let i = msgs.length - 1; i >= 0; i--) {
        const msg = msgs[i]
        // 跳过错误消息
        if (msg.error || msg.errorCode) {
            continue
        }
        const size = estimateTokensFromMessages([msg]) + 20 // 20 作为预估的误差补偿
        // 只有 OpenAI 才支持上下文 tokens 数量限制
        if (settings.aiProvider === 'openai') {
            // if (size + totalLen > openaiMaxContextTokens) {
            //     break
            // }
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

export function initEmptyChatSession(): Session {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    return {
        id: uuidv4(),
        name: 'Untitled',
        type: 'chat',
        messages: [
            {
                id: uuidv4(),
                role: 'system',
                content: settings.defaultPrompt || defaults.getDefaultPrompt(),
            },
        ],
    }
}

export function initEmptyPictureSession(): Session {
    return {
        id: uuidv4(),
        name: 'Untitled',
        type: 'picture',
        messages: [
            {
                id: uuidv4(),
                role: 'system',
                content: i18n.t('Image Creator Intro'),
            },
        ],
    }
}

export function getSessions() {
    const store = getDefaultStore()
    return store.get(atoms.sessionsAtom)
}

export function getSortedSessions() {
    const store = getDefaultStore()
    return store.get(atoms.sortedSessionsAtom)
}

export function getCurrentSession() {
    const store = getDefaultStore()
    return store.get(atoms.currentSessionAtom)
}

export function getCurrentMessages() {
    const store = getDefaultStore()
    return store.get(atoms.currentMessageListAtom)
}

export function mergeSettings(globalSettings: Settings, sessionSetting: Partial<ModelSettings>, sessionType?: 'picture' | 'chat'): Settings {
    let specialSettings = sessionSetting
    // 过滤掉会话专属设置中不应该存在的设置项，为了兼容旧版本数据和防止疏漏
    switch (sessionType) {
        case 'picture':
            specialSettings = pickPictureSettings(specialSettings as Settings)
            break
        case undefined:
        case 'chat':
        default:
            specialSettings = settings2SessionSettings(specialSettings as Settings)
            break
    }
    specialSettings = omit(specialSettings) // 需要 omit 来去除 undefined，否则会覆盖掉全局配置
    return {
        ...globalSettings,
        ...specialSettings, // 会话配置优先级高于全局配置
    }
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

export function getCurrentSessionMergedSettings() {
    const store = getDefaultStore()
    const globalSettings = store.get(atoms.settingsAtom)
    const session = store.get(atoms.currentSessionAtom)
    if (!session.settings) {
        return globalSettings
    }
    return mergeSettings(globalSettings, session.settings, session.type)
}

export async function exportChat(session: Session, scope: ExportChatScope, format: ExportChatFormat) {
    const threads: SessionThread[] = scope == 'all_threads' ? session.threads || [] : []
    threads.push({
        id: session.id,
        name: session.threadName || session.name,
        messages: session.messages,
        createdAt: Date.now(),
    })

    if (format == 'Markdown') {
        const content = formatChatAsMarkdown(session.name, threads)
        platform.exporter.exportTextFile(`${session.name}.md`, content)
    } else if (format == 'TXT') {
        const content = formatChatAsTxt(session.name, threads);
        platform.exporter.exportTextFile(`${session.name}.txt`, content)
    } else if (format == 'HTML') {
        const content = await formatChatAsHtml(session.name, threads);
        platform.exporter.exportTextFile(`${session.name}.html`, content)
    }
}

export async function exportCurrentSessionChat(content: ExportChatScope, format: ExportChatFormat) {
    const store = getDefaultStore()
    const currentSession = store.get(atoms.currentSessionAtom)
    await exportChat(currentSession, content, format)
}
