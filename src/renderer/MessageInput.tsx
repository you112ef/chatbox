import React, { useEffect, useState, MutableRefObject } from 'react'
import { Stack, Button, Grid, Typography, TextField } from '@mui/material'
import { Message, createMessage } from './types'
import { useTranslation } from 'react-i18next'
import SendIcon from '@mui/icons-material/Send'
import * as atoms from './stores/atoms'
import { useAtom } from 'jotai'
import * as sessionActions from './stores/sessionActions'
import * as scrollActions from './stores/scrollActions'
import * as dom from './hooks/dom'

export interface Props {
    currentSessionId: string
}

export default function MessageInput(props: Props) {
    const [quote, setQuote] = useAtom(atoms.quoteAtom)
    const { t } = useTranslation()
    const [messageInput, setMessageInput] = useState('')
    useEffect(() => {
        if (quote !== '') {
            setMessageInput(quote)
            setQuote('')
            dom.focusMessageInput()
        }
    }, [quote])
    useEffect(() => {
        dom.focusMessageInput()
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
        setTimeout(scrollActions.scrollToBottom, 100) // wait for message rendering
    }
    const handleSubmit = (needGenerating = true) => {
        if (messageInput.trim() === '') {
            return
        }
        submit(createMessage('user', messageInput), needGenerating)
        setMessageInput('')
    }

    useEffect(() => {
        function keyboardShortcut(e: KeyboardEvent) {
            if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
                dom.focusMessageInput()
            }
        }
        window.addEventListener('keydown', keyboardShortcut)
        return () => {
            window.removeEventListener('keydown', keyboardShortcut)
        }
    }, [])

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
                            label="Prompt"
                            value={messageInput}
                            onChange={(event) => setMessageInput(event.target.value)}
                            fullWidth
                            maxRows={12}
                            autoFocus
                            id={dom.messageInputID}
                            onKeyDown={(event) => {
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
                                if (event.keyCode === 13 && event.ctrlKey) {
                                    event.preventDefault()
                                    handleSubmit(false)
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
                <Typography variant="caption" style={{ opacity: 0.3 }}>
                    {t('[Enter] send, [Shift+Enter] line break, [Ctrl+Enter] send without generating')}
                </Typography>
            </Stack>
        </form>
    )
}
