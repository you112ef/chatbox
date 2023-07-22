import React, { useEffect, useRef } from 'react'
import { Toolbar, Box, IconButton, ButtonGroup, Stack, Grid, Typography, debounce, Chip, Tooltip } from '@mui/material'
import { Session, getMsgDisplayModelName } from './types'
import CleaningServicesIcon from '@mui/icons-material/CleaningServices'
import Save from '@mui/icons-material/Save'
import { useTranslation } from 'react-i18next'
import icon from './icon.png'
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp'
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown'
import SponsorChip from './SponsorChip'
import './styles/App.css'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import * as api from './api'
import * as atoms from './stores/atoms'
import { useAtomValue } from 'jotai'
import MessageInput from './MessageInput'
import MessageList from './MessageList'
import * as toastActions from './stores/toastActions'
import * as sessionActions from './stores/sessionActions'
import * as scrollActions from './stores/scrollActions'
import TuneIcon from '@mui/icons-material/Tune'

interface Props {
    showMenu: boolean
    setShowMenu(showMenu: boolean): void
    setConfigureChatConfig(session: Session | null): void
    setSessionClean(session: Session | null): void
}

export default function MainPane(props: Props) {
    const { t } = useTranslation()
    const currentSession = useAtomValue(atoms.currentSessionAtom)

    const atScrollTop = useAtomValue(atoms.messageScrollingAtTopAtom)
    const atScrollBottom = useAtomValue(atoms.messageScrollingAtBottomAtom)

    // 会话名称自动生成
    useEffect(() => {
        if (
            currentSession.name === 'Untitled' &&
            currentSession.messages.findIndex((msg) => msg.role === 'assistant' && !msg.generating) !== -1
        ) {
            sessionActions.generateName(currentSession.id)
        }
    }, [currentSession.messages])

    const codeBlockCopyEvent = useRef((e: Event) => {
        const target: HTMLElement = e.target as HTMLElement

        const isCopyActionClassName = target.className === 'copy-action'
        const isCodeBlockParent = target.parentElement?.parentElement?.className === 'code-block-wrapper'

        // check is copy action button
        if (!(isCopyActionClassName && isCodeBlockParent)) {
            return
        }

        // got codes
        const content = target?.parentNode?.parentNode?.querySelector('code')?.innerText ?? ''

        // do copy
        // * thats lines copy from copy block content action
        navigator.clipboard.writeText(content)
        toastActions.add(t('copied to clipboard'))
    })

    // bind code block copy event on mounted
    useEffect(() => {
        document.addEventListener('click', codeBlockCopyEvent.current)

        return () => {
            document.removeEventListener('click', codeBlockCopyEvent.current)
        }
    }, [])

    const editCurrentSession = () => {
        props.setConfigureChatConfig(currentSession)
    }

    const exportSession = async (session: Session) => {
        const content = session.messages
            .map((msg) => `**${msg.role}**:\n${msg.content}`)
            .join('\n\n--------------------\n\n')
        return api.exportTextFile('Export.md', content)
    }

    return (
        <Grid
            item
            xs
            sx={{
                width: '0px',
                height: '100%',
            }}
        >
            <Stack
                sx={{
                    height: '100%',
                    position: 'relative',
                }}
            >
                <Toolbar variant="dense" style={{ padding: '0 10px' }}>
                    <IconButton onClick={() => props.setShowMenu(!props.showMenu)}>
                        {!props.showMenu ? (
                            <img
                                src={icon}
                                style={{
                                    width: '30px',
                                    height: '30px',
                                }}
                            />
                        ) : (
                            <MenuOpenIcon style={{ fontSize: '26px' }} />
                        )}
                    </IconButton>
                    <Typography
                        variant="h6"
                        color="inherit"
                        component="div"
                        noWrap
                        sx={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                        className="flex items-center cursor-pointer"
                        onClick={() => {
                            editCurrentSession()
                        }}
                    >
                        <span>{currentSession.name}</span>
                        {currentSession.settings && (
                            <Tooltip
                                title={t('Current conversation configured with specific model settings')}
                                className="cursor-pointer"
                            >
                                <Chip
                                    className="ml-2 cursor-pointer"
                                    variant="outlined"
                                    color="warning"
                                    size="small"
                                    icon={<TuneIcon className="cursor-pointer" />}
                                    label={
                                        <span className="cursor-pointer">
                                            {getMsgDisplayModelName(currentSession.settings)}
                                        </span>
                                    }
                                />
                            </Tooltip>
                        )}
                    </Typography>
                    <SponsorChip sessionId={currentSession.id} />
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2 }}
                        onClick={() => props.setSessionClean(currentSession)}
                    >
                        <CleaningServicesIcon />
                    </IconButton>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{}}
                        onClick={() => exportSession(currentSession)}
                    >
                        <Save />
                    </IconButton>
                </Toolbar>
                <MessageList />
                <Box sx={{ padding: '20px 0', position: 'relative' }}>
                    <ButtonGroup
                        sx={{
                            position: 'absolute',
                            right: '0.2rem',
                            top: '-5.5rem',
                            opacity: 0.6,
                        }}
                        orientation="vertical"
                    >
                        <IconButton
                            onClick={() => scrollActions.scrollToTop()}
                            sx={{
                                visibility: atScrollTop ? 'hidden' : 'visible',
                            }}
                        >
                            <ArrowCircleUpIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => scrollActions.scrollToBottom()}
                            sx={{
                                visibility: atScrollBottom ? 'hidden' : 'visible',
                            }}
                        >
                            <ArrowCircleDownIcon />
                        </IconButton>
                    </ButtonGroup>
                    <MessageInput currentSessionId={currentSession.id} />
                </Box>
            </Stack>
        </Grid>
    )
}
