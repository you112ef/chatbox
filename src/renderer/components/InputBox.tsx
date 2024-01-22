import React, { useEffect, useRef, useState } from 'react'
import { Tooltip, Stack, Button, Grid, Typography, TextField, ButtonGroup } from '@mui/material'
import { Message, SessionType, createMessage } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import SendIcon from '@mui/icons-material/Send'
import * as atoms from '../stores/atoms'
import { useAtom, useAtomValue } from 'jotai'
import * as sessionActions from '../stores/sessionActions'
import * as dom from '../hooks/dom'
import ClearAllIcon from '@mui/icons-material/ClearAll';
import UndoIcon from '@mui/icons-material/Undo';
import { Shortcut } from './Shortcut'

export interface Props {
    currentSessionId: string
    currentSessionType: SessionType
}

export default function InputBox(props: Props) {
    const [quote, setQuote] = useAtom(atoms.quoteAtom)
    const isSmallScreen = useAtomValue(atoms.isSmallScreenAtom)
    const { t } = useTranslation()
    const [messageInput, setMessageInput] = useState('')
    const [showRollbackThreadButton, setShowRollbackThreadButton] = useState(false)
    const showRollbackThreadButtonTimerRef = useRef<null | NodeJS.Timeout>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [previousMessageQuickInputMark, setPreviousMessageQuickInputMark] = useState('')

    useEffect(() => {
        if (quote !== '') {
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
        submit(createMessage('user', messageInput), needGenerating)
        setMessageInput('')
        window.gtag('event', 'send_message', { event_category: 'user' })
        // 重置清理上下文按钮
        if (showRollbackThreadButton) {
            setShowRollbackThreadButton(false)
            if (showRollbackThreadButtonTimerRef.current) {
                clearTimeout(showRollbackThreadButtonTimerRef.current)
            }
        }
    }

    const onMessageInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.target.value
        setMessageInput(input)
        setPreviousMessageQuickInputMark('')
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
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

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
            }}
        >
            <Stack direction="column" spacing={1}>
                <Grid container spacing={1}>
                    <Grid item xs="auto" className='flex items-start' >
                        <ButtonGroup size='medium'>
                            {
                                showRollbackThreadButton ? (
                                    <Tooltip title={
                                        <div className='text-center inline-block'>
                                            <span>{t('Back to Previous')}</span>
                                        </div>
                                    } placement="top">
                                        <Button
                                            variant="outlined"
                                            sx={{ paddingY: '15px' }}
                                            color='inherit'
                                            className='opacity-30 hover:opacity-100'
                                            onClick={rollbackThread}
                                        >
                                            <UndoIcon />
                                        </Button>
                                    </Tooltip>
                                ) : (
                                    <Tooltip title={
                                        <div className='text-center inline-block'>
                                            <span>{t('Refresh Context, Start New Thread')}</span>
                                            <br />
                                            <Shortcut keys={['Option', 'R']} size='small' opacity={0.7} />
                                        </div>
                                    } placement="top">
                                        <Button
                                            variant="outlined"
                                            sx={{ paddingY: '15px' }}
                                            color='inherit'
                                            className='opacity-30 hover:opacity-100'
                                            onClick={startNewThread}
                                        >
                                            <ClearAllIcon />
                                        </Button>
                                    </Tooltip>
                                )
                            }
                        </ButtonGroup>
                    </Grid>
                    <Grid item xs>
                        <TextField
                            multiline
                            maxRows={12}
                            label=""
                            value={messageInput}
                            onChange={onMessageInput}
                            fullWidth
                            color={props.currentSessionType === 'picture' ? 'secondary' : 'primary'}
                            id={dom.messageInputID}
                            onKeyDown={onKeyDown}
                            inputRef={inputRef}
                        />
                    </Grid>
                    <Grid item xs="auto">
                        <Button
                            type="submit"
                            variant="contained"
                            size='large'
                            style={{ padding: '15px 16px' }}
                            color={props.currentSessionType === 'picture' ? 'secondary' : 'primary'}
                        >
                            <SendIcon />
                        </Button>
                    </Grid>
                </Grid>
                {!isSmallScreen && (
                    <Typography variant="caption" style={{ opacity: 0.3 }}>
                        {t('[Enter] send, [Shift+Enter] line break, [Ctrl+Enter] send without generating')}
                    </Typography>
                )}
            </Stack>
        </form>
    )
}
