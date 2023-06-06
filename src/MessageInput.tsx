import React, { useEffect, useState, MutableRefObject } from 'react';
import { Stack, Button, Grid, Typography, TextField } from '@mui/material';
import { Message, createMessage } from './types'
import { useTranslation } from "react-i18next";
import "./styles/App.scss"
import SendIcon from '@mui/icons-material/Send';
import * as atoms from './stores/atoms'
import { useAtom } from 'jotai'
import * as sessionActions from './stores/sessionActions'

export interface Props {
    currentSessionId: string
    messageScrollRef: MutableRefObject<{ msgId: string, smooth?: boolean | undefined } | null>
    textareaRef: MutableRefObject<HTMLTextAreaElement | null>
}

export default function MessageInput(props: Props) {
    const [quote, setQuote] = useAtom(atoms.quoteAtom)
    const { t } = useTranslation()
    const [messageInput, setMessageInput] = useState('')
    useEffect(() => {
        if (quote !== '') {
            setMessageInput(quote)
            setQuote('')
            props.textareaRef?.current?.focus()
        }
    }, [quote])

    const submit = async (newUserMsg: Message, needGenerating = true) => {
        if (needGenerating) {
            sessionActions.insertMessage(props.currentSessionId, newUserMsg)
            const newAssistantMsg = createMessage('assistant', '....')
            sessionActions.insertMessage(props.currentSessionId, newAssistantMsg)
            sessionActions.generate(props.currentSessionId, newAssistantMsg, props.messageScrollRef)
            props.messageScrollRef.current = { msgId: newAssistantMsg.id, smooth: true }
        } else {
            sessionActions.insertMessage(props.currentSessionId, newUserMsg)
            props.messageScrollRef.current = { msgId: newUserMsg.id, smooth: true }
        }
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
                props.textareaRef?.current?.focus();
            }
        }
        window.addEventListener('keydown', keyboardShortcut);
        return () => {
            window.removeEventListener('keydown', keyboardShortcut)
        }
    }, [])

    return (
        <form onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
        }}>
            <Stack direction="column" spacing={1} >
                <Grid container spacing={1}>
                    <Grid item xs>
                        <TextField
                            inputRef={props.textareaRef}
                            multiline
                            label="Prompt"
                            value={messageInput}
                            onChange={(event) => setMessageInput(event.target.value)}
                            fullWidth
                            maxRows={12}
                            autoFocus
                            id='message-input'
                            onKeyDown={(event) => {
                                if (event.keyCode === 13 && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
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
                    <Grid item xs='auto'>
                        <Button type='submit' variant="contained" size='large'
                            style={{ padding: '15px 16px' }}>
                            <SendIcon />
                        </Button>
                    </Grid>
                </Grid>
                <Typography variant='caption' style={{ opacity: 0.3 }}>{t('[Enter] send, [Shift+Enter] line break, [Ctrl+Enter] send without generating')}</Typography>
            </Stack>
        </form>
    )
}
