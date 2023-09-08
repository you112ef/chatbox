import React, { useEffect, useState } from 'react'
import { Stack, Button, Grid, Typography, TextField } from '@mui/material'
import { Message, createMessage } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import SendIcon from '@mui/icons-material/Send'
import * as atoms from '../stores/atoms'
import { useAtom, useAtomValue } from 'jotai'
import * as sessionActions from '../stores/sessionActions'
import * as scrollActions from '../stores/scrollActions'
import * as dom from '../hooks/dom'

export interface Props {
    currentSessionId: string
}

export default function InputBox(props: Props) {
    const [quote, setQuote] = useAtom(atoms.quoteAtom)
    const isSmallScreen = useAtomValue(atoms.isSmallScreenAtom)
    const { t } = useTranslation()
    const [messageInput, setMessageInput] = useState('')
    const [previousMessageInput, setPreviousMessageInput] = useState('')
    useEffect(() => {
        if (quote !== '') {
            setMessageInput(quote)
            setQuote('')
            dom.focusMessageInput()
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
        if (messageInput.trim() === '') {
            return
        }
        submit(createMessage('user', messageInput), needGenerating)
        setPreviousMessageInput(messageInput)
        setMessageInput('')
        window.gtag('event', 'send_message', { event_category: 'user' })
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
                    <Grid item xs>
                        <TextField
                            multiline
                            maxRows={12}
                            label="Prompt"
                            value={messageInput}
                            onChange={(event) => setMessageInput(event.target.value)}
                            fullWidth
                            id={dom.messageInputID}
                            onKeyDown={(event) => {
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
                                // 向上键翻阅历史消息
                                if (event.keyCode === 38 && messageInput === '') {
                                    event.preventDefault()
                                    setMessageInput(previousMessageInput)
                                    return
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs="auto">
                        <Button type="submit" variant="contained" size="large" style={{ padding: '15px 16px' }}>
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
