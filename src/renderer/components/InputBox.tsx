import React, { useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Typography, useTheme } from '@mui/material'
import { Message, ModelProvider, SessionType, createMessage } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useAtom, useSetAtom } from 'jotai'
import * as sessionActions from '../stores/sessionActions'
import * as dom from '../hooks/dom'
import { Shortcut } from './Shortcut'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import {
    Image, FolderClosed, ListRestart, Mic, Undo2, SendHorizontal,
    Clock, ChevronRight, MessageSquareDashed, MessagesSquare, ChevronsUpDown,
    Settings2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { scrollToMessage } from '@/stores/scrollActions'
import icon from '../static/icon.png'
import { trackingEvent } from '@/packages/event'
import storage from '@/storage'
import { ImageInStorage, ImageMiniCard } from './Image'
import MiniButton from './MiniButton'
import _ from 'lodash'
import * as toastActions from '@/stores/toastActions'

export interface Props {
    currentSessionId: string
    currentSessionType: SessionType
}

export default function InputBox(props: Props) {
    const theme = useTheme()
    const [quote, setQuote] = useAtom(atoms.quoteAtom)
    const isSmallScreen = useIsSmallScreen()
    const setThreadHistoryDrawerOpen = useSetAtom(atoms.showThreadHistoryDrawerAtom)
    const setChatConfigDialogSession = useSetAtom(atoms.chatConfigDialogAtom)
    const { t } = useTranslation()
    const [messageInput, setMessageInput] = useState('')
    const [pictureKeys, setPictureKeys] = useState<string[]>([])
    const pictureInputRef = useRef<HTMLInputElement | null>(null)
    const [showRollbackThreadButton, setShowRollbackThreadButton] = useState(false)
    const showRollbackThreadButtonTimerRef = useRef<null | NodeJS.Timeout>(null)
    const inputRef = useRef<HTMLTextAreaElement | null>(null)
    const [previousMessageQuickInputMark, setPreviousMessageQuickInputMark] = useState('')

    useEffect(() => {
        if (quote !== '') {
            // TODO: 支持引用消息中的图片
            setMessageInput(quote)
            setQuote('')
            setPreviousMessageQuickInputMark('')
            dom.focusMessageInput()
            dom.setMessageInputCursorToEnd()
        }
    }, [quote])
    useEffect(() => {
        if (!isSmallScreen) {
            dom.focusMessageInput() // 大屏幕切换会话时自动聚焦
        }
    }, [props.currentSessionId])

    const submit = async (newUserMsg: Message, needGenerating = true) => {
        if (needGenerating) {
            sessionActions.insertMessage(props.currentSessionId, newUserMsg)
            const newAssistantMsg = createMessage('assistant', '....')
            sessionActions.insertMessage(props.currentSessionId, newAssistantMsg)
            sessionActions.generate(props.currentSessionId, newAssistantMsg)
        } else {
            sessionActions.insertMessage(props.currentSessionId, newUserMsg)
        }
    }
    const handleSubmit = (needGenerating = true) => {
        setPreviousMessageQuickInputMark('')
        if (messageInput.trim() === '') {
            return
        }
        const newMessage = createMessage('user', messageInput)
        if (pictureKeys.length > 0) {
            newMessage.pictures = pictureKeys.map(k => ({ storageKey: k }))
        }
        submit(newMessage, needGenerating)
        setMessageInput('')
        setPictureKeys([])
        trackingEvent('send_message', { event_category: 'user' })
        // 重置清理上下文按钮
        if (showRollbackThreadButton) {
            setShowRollbackThreadButton(false)
            if (showRollbackThreadButtonTimerRef.current) {
                clearTimeout(showRollbackThreadButtonTimerRef.current)
            }
        }
        setTimeout(() => scrollToMessage(newMessage.id), 100)
    }

    const minTextareaHeight = isSmallScreen ? 32 : 96
    const maxTextareaHeight = 192

    const onMessageInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const input = event.target.value
        setMessageInput(input)
        setPreviousMessageQuickInputMark('')
        // 自动调整输入框高度
        if (inputRef.current) {
            inputRef.current.style.height = 'inherit'; // Reset the height - important to shrink on delete
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, maxTextareaHeight)}px`;
        }
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // 发送
        if (
            event.keyCode === 13 &&
            !event.shiftKey &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey
        ) {
            event.preventDefault()
            handleSubmit()
            return
        }
        // 发送但不生成
        if (event.keyCode === 13 && event.ctrlKey) {
            event.preventDefault()
            handleSubmit(false)
            return
        }
        // 向上向下键翻阅历史消息
        if (
            (event.key === 'ArrowUp' || event.key === 'ArrowDown')
            && inputRef.current
            && inputRef.current === document.activeElement  // 聚焦在输入框
            && (messageInput.length === 0 || window.getSelection()?.toString() === messageInput)    // 要么为空，要么输入框全选
        ) {
            event.preventDefault()
            let historyMessages = sessionActions.getCurrentMessages()
            historyMessages = historyMessages.slice(historyMessages.length - 100)
            historyMessages = historyMessages.filter((m => m.role !== 'assistant'))
            if (historyMessages.length === 0) {
                return
            }
            if (!previousMessageQuickInputMark) {
                if (event.key === 'ArrowUp') {
                    const msg = historyMessages[historyMessages.length - 1]
                    setMessageInput(msg.content)
                    setPictureKeys(
                        msg.pictures
                            ? _.compact(msg.pictures.map(p => p.storageKey))
                            : []
                    )
                    setPreviousMessageQuickInputMark(msg.id)
                    setTimeout(() => inputRef.current?.select(), 10)
                    return
                } else if (event.key === 'ArrowDown') {
                    return
                }
            } else {
                const ix = historyMessages.findIndex(m => m.id === previousMessageQuickInputMark)
                if (ix === -1) {
                    return
                }
                const msg = event.key === 'ArrowUp' ? historyMessages[ix - 1] : historyMessages[ix + 1]
                if (msg) {
                    setMessageInput(msg.content)
                    setPictureKeys(
                        msg.pictures
                            ? _.compact(msg.pictures.map(p => p.storageKey))
                            : []
                    )
                    setPreviousMessageQuickInputMark(msg.id)
                    setTimeout(() => inputRef.current?.select(), 10)
                }
                return
            }
        }
        // 防止创建新话题时键入字符
        if (event.code === 'KeyR' && event.altKey) {
            event.preventDefault()
            // setMessageInput(messageInput.replace(`®`, ''))
            return
        }
    }
    const startNewThread = () => {
        sessionActions.startNewThread()
        // 显示撤回上下文按钮
        setShowRollbackThreadButton(true)
        if (showRollbackThreadButtonTimerRef.current) {
            clearTimeout(showRollbackThreadButtonTimerRef.current)
        }
        showRollbackThreadButtonTimerRef.current = setTimeout(() => {
            setShowRollbackThreadButton(false)
        }, 5000)
    }
    const rollbackThread = () => {
        setShowRollbackThreadButton(false)
        if (showRollbackThreadButtonTimerRef.current) {
            clearTimeout(showRollbackThreadButtonTimerRef.current)
        }
        sessionActions.rollbackStartNewThread(props.currentSessionId)
    }

    const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) {
            return
        }
        const files = event.target.files
        for (const file of Array.from(files)) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = async (e) => {
                    if (e.target && e.target.result) {
                        const base64 = e.target.result as string
                        const key = `picture:input-box:${uuidv4()}`
                        await storage.setBlob(key, base64)
                        setPictureKeys((keys) => [...keys, key])
                    }
                }
                reader.readAsDataURL(file)
            }
        }
        event.target.value = ''
    }
    const onImageUpload = () => {
        const settings = sessionActions.getCurrentSessionMergedSettings()
        if (
            (settings.aiProvider === ModelProvider.ChatboxAI && settings.chatboxAIModel === 'chatboxai-4')
            || (settings.aiProvider === ModelProvider.OpenAI && settings.model === 'gpt-4-vision-preview')
            || (settings.aiProvider === ModelProvider.Azure && settings.azureDeploymentName === 'gpt-4-vision-preview')
            || (settings.aiProvider === ModelProvider.Claude && settings.claudeModel.startsWith('claude-3'))
        ) {
            pictureInputRef.current?.click()
            return
        }
        toastActions.add(t('Current model does not support image input'))
        return
    }
    const onImageDelete = async (picKey: string) => {
        setPictureKeys(keys => keys.filter(k => k !== picKey))
        // 不删除图片数据，因为可能在其他地方引用，比如通过上下键盘的历史消息快捷输入、发送的消息中引用
        // await storage.delBlob(picKey)
    }

    // 小彩蛋
    const [easterEgg, setEasterEgg] = useState(false)

    return (
        <div className='flex flex-col pl-1 pr-2 sm:pl-2 sm:pr-4' id={dom.InputBoxID}
            style={{
                borderTopWidth: '1px',
                borderTopStyle: 'solid',
                borderTopColor: theme.palette.divider,
            }}
        >
            <div className='flex flex-row flex-nowrap justify-between py-1'>
                <div className='flex flex-row items-center'>
                    <MiniButton className='mr-1 sm:mr-2 hover:bg-transparent' style={{ color: theme.palette.text.primary }}
                        onClick={() => {
                            setEasterEgg(true)
                            setTimeout(() => setEasterEgg(false), 1000)
                        }}
                    >
                        <img className={cn('w-5 h-5', easterEgg ? 'animate-spin' : '')} src={icon} />
                    </MiniButton>
                    {
                        showRollbackThreadButton ? (
                            <MiniButton className='mr-1 sm:mr-2' style={{ color: theme.palette.text.primary }}
                                tooltipTitle={
                                    <div className='text-center inline-block'>
                                        <span>{t('Back to Previous')}</span>
                                    </div>
                                }
                                tooltipPlacement='top'
                                onClick={rollbackThread}
                            >
                                <Undo2 size='22' strokeWidth={1} />
                            </MiniButton>
                        ) : (
                            <MiniButton className='mr-1 sm:mr-2' style={{ color: theme.palette.text.primary }}
                                tooltipTitle={
                                    <div className='text-center inline-block'>
                                        <span>{t('Refresh Context, Start a New Thread')}</span>
                                        <br />
                                        <Shortcut keys={['Option', 'R']} size='small' opacity={0.7} />
                                    </div>
                                }
                                tooltipPlacement='top'
                                onClick={startNewThread}
                            >
                                {/* <ListRestart size='22' strokeWidth={1} /> */}
                                <MessageSquareDashed size='22' strokeWidth={1} />
                            </MiniButton>
                        )
                    }
                    <MiniButton className='mr-1 sm:mr-2' style={{ color: theme.palette.text.primary }}
                        onClick={() => setThreadHistoryDrawerOpen(true)}
                        tooltipTitle={
                            <div className='text-center inline-block'>
                                <span>{t('View historical threads')}</span>
                            </div>
                        }
                        tooltipPlacement='top'
                    >
                        <MessagesSquare size='22' strokeWidth={1} />
                    </MiniButton>
                    <input type='file' ref={pictureInputRef} className='hidden' onChange={onFileInputChange}
                        // accept="image/png, image/jpeg, image/gif" 
                        accept="image/png, image/jpeg"
                    />
                    <MiniButton className='mr-1 sm:mr-2' style={{ color: theme.palette.text.primary }}
                        onClick={onImageUpload}
                        tooltipTitle={
                            <div className='text-center inline-block'>
                                <span>{t('Attach Image')}</span>
                            </div>
                        }
                        tooltipPlacement='top'
                    >
                        <Image size='22' strokeWidth={1} />
                    </MiniButton>
                    <MiniButton className='mr-1 sm:mr-2' style={{ color: theme.palette.text.primary }}
                        onClick={() => setChatConfigDialogSession(sessionActions.getCurrentSession())}
                        tooltipTitle={
                            <div className='text-center inline-block'>
                                <span>{t('Customize settings for the current conversation')}</span>
                            </div>
                        }
                        tooltipPlacement='top'
                    >
                        <Settings2 size='22' strokeWidth={1} />
                    </MiniButton>
                </div>
                <div className='flex flex-row items-center'>
                    {/* <MiniButton className='mr-2 w-auto flex items-center opacity-70'>
                        <span className='text-sm' style={{ color: theme.palette.text.primary }}>
                            Chatbox AI 4
                        </span>
                        <ChevronsUpDown size='16' strokeWidth={1}
                            style={{ color: theme.palette.text.primary }}
                            className='opacity-50'
                        />
                    </MiniButton> */}
                    {/* <MiniButton className='mr-2 w-auto flex items-center opacity-70'>
                        <span className='text-sm' style={{ color: theme.palette.text.primary }}>
                            严谨(0.7)
                        </span>
                        <ChevronsUpDown size='16' strokeWidth={1}
                            style={{ color: theme.palette.text.primary }}
                            className='opacity-50'
                        />
                    </MiniButton> */}
                    <MiniButton className='w-8 ml-2'
                        style={{
                            color: theme.palette.getContrastText(theme.palette.primary.main),
                            backgroundColor: props.currentSessionType === 'picture'
                                ? theme.palette.secondary.main
                                : theme.palette.primary.main,
                        }}
                        tooltipTitle={
                            <Typography variant="caption">
                                {t('[Enter] send, [Shift+Enter] line break, [Ctrl+Enter] send without generating')}
                            </Typography>
                        }
                        tooltipPlacement='top'
                        onClick={() => handleSubmit()}
                    >
                        <SendHorizontal size='22' strokeWidth={1} />
                    </MiniButton>
                </div>
            </div>
            <div className='w-full pl-1 pb-2'>
                <textarea id={dom.messageInputID}
                    className={cn(
                        `w-full max-h-[${maxTextareaHeight}px]`,
                        'overflow-y resize-none border-none outline-none',
                        'bg-slate-300/25 rounded-lg p-2',
                        'sm:bg-transparent sm:p-1'
                    )}
                    value={messageInput} onChange={onMessageInput}
                    onKeyDown={onKeyDown}
                    ref={inputRef}
                    autoFocus={!isSmallScreen}
                    style={{
                        height: 'auto',
                        minHeight: minTextareaHeight + 'px',
                        color: theme.palette.text.primary,
                        fontFamily: theme.typography.fontFamily,
                        fontSize: theme.typography.body1.fontSize,
                    }}
                    placeholder={t('Type your question here...') || ''}
                    {...{ enterKeyHint: 'send' } as any}
                />
                <div className='flex flex-row items-center' onClick={() => dom.focusMessageInput()} >
                    {
                        pictureKeys.map(picKey => (
                            <ImageMiniCard storageKey={picKey} onDelete={() => onImageDelete(picKey)} />
                        ))
                    }
                </div>
            </div>
        </div>
    )
}
