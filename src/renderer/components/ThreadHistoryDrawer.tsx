import React, { useEffect, useRef, useState } from 'react'
import {
    currentThreadHistoryHashAtom, currentSessionIdAtom, showThreadHistoryDrawerAtom, currentSessionAtom
} from "@/stores/atoms"
import {
    Tooltip, Box, Drawer, MenuList, MenuItem, ListItemText, Typography, ListItemIcon, IconButton
} from "@mui/material"
import { useAtom, useAtomValue } from "jotai"
import { scrollToMessage } from "@/stores/scrollActions";
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { SessionThreadBrief } from 'src/shared/types';
import * as sessionActions from '../stores/sessionActions'
import { useTranslation } from 'react-i18next';
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import SwapCallsIcon from '@mui/icons-material/SwapCalls';
import DeleteIcon from "@mui/icons-material/Delete";
import StyledMenu from "@/components/StyledMenu";

interface Props {
}

export default function ThreadHistoryDrawer(props: Props) {
    const { t } = useTranslation()
    const [showDrawer, setShowDrawer] = useAtom(showThreadHistoryDrawerAtom)
    const currentThreadHistoryHash = useAtomValue(currentThreadHistoryHashAtom)
    const currentSessionId = useAtomValue(currentSessionIdAtom)
    const currentSession = useAtomValue(currentSessionAtom)

    const threadList = Object.values(currentThreadHistoryHash)

    // 每次打开后自动滚动。如果选择了某个历史，则滚动到该历史；如果没有选择，则滚动到末尾
    const ref = useRef<VirtuosoHandle>(null)
    useEffect(() => {
        setTimeout(() => {
            if (ref.current) {
                if (showDrawer === true) {
                    ref.current.scrollToIndex({
                        index: threadList.length - 1,
                        align: 'start',
                    })
                } else {
                    const index = threadList.findIndex(t => t.id === showDrawer)
                    if (index >= 0) {
                        ref.current.scrollToIndex({ index, align: 'start' })
                    }
                }
            }
        }, 100);
    }, [showDrawer, ref.current])

    const gotoThreadMessage = (threadId: string) => {
        const thread = threadList.find(t => t.id === threadId)
        if (!thread) {
            return
        }
        scrollToMessage(thread.firstMessageId, 'start')
        setShowDrawer(false)
    }

    const switchThread = (threadId: string) => {
        sessionActions.switchThread(currentSessionId, threadId)
        setShowDrawer(false)
    }

    return (
        <Drawer
            anchor={'right'}
            open={!!showDrawer}
            onClose={() => setShowDrawer(false)}
            sx={{
                '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                    width: 280,
                    border: 'none',
                },
            }}
        >
            <Box className='ThreadHistoryDrawer flex flex-col h-full w-full'>
                <Box sx={{ padding: '1rem 0.5rem 0.2rem 0.5rem', margin: '0.1rem 0.1rem 0.1rem 0.2rem' }} >
                    <span className="text-xs opacity-80">{t('Threads History')}</span>
                </Box>
                <MenuList
                    sx={{
                        position: 'relative',
                        overflow: 'auto',
                        '& ul': { padding: 0 },
                        paddingX: '0.5rem',
                        paddingY: '0',
                    }}
                    className="w-full flex-grow"
                    component="div"
                >
                    <Virtuoso
                        data={threadList}
                        ref={ref}
                        increaseViewportBy={{ top: 500, bottom: 500 }}
                        itemContent={(index, thread) => (
                            <ThreadItem
                                key={index}
                                thread={thread}
                                goto={gotoThreadMessage}
                                showHistoryDrawer={showDrawer}
                                switchThread={switchThread}
                                lastOne={index === threadList.length - 1}
                            />
                        )}
                    />
                </MenuList>
            </Box>
        </Drawer>
    )
}

function ThreadItem(props: {
    thread: SessionThreadBrief
    goto(threadId: string): void
    showHistoryDrawer: string | boolean
    switchThread(threadId: string): void
    lastOne?: boolean
}) {
    const { t } = useTranslation()
    const { thread, goto, showHistoryDrawer, switchThread, lastOne } = props
    const [hovering, setHovering] = useState(false)
    const selected = thread.id === showHistoryDrawer
    const threadName = thread.name || t('New Thread')
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)
    const currentSessionId = useAtomValue(currentSessionIdAtom)

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        event.preventDefault()
        setAnchorEl(event.currentTarget)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    return (
        <>
            <Tooltip
                title={
                    <Typography sx={{ fontSize: '0.9rem' }}>
                        {`${threadName} ${(thread.createdAtLabel || '').toLocaleString()}`}
                    </Typography>
                }
                placement="left"
            >
                <MenuItem
                    key={thread.id}
                    selected={selected}
                    onClick={() => {
                        goto(thread.id)
                    }}
                    onMouseEnter={() => {
                        setHovering(true)
                    }}
                    onMouseOver={() => {
                        setHovering(true)
                    }}
                    onMouseLeave={() => {
                        setHovering(false)
                    }}
                    sx={{ padding: '0.1rem', margin: '0.1rem' }}
                >
                    <ListItemIcon>
                        <span className='opacity-50 text-xs'>{thread.messageCount}</span>
                    </ListItemIcon>
                    <ListItemText>
                        <Typography variant="inherit" noWrap>
                            {threadName}
                            {
                                thread.createdAtLabel && (
                                    <span className="pl-1 opacity-70">
                                        {thread.createdAtLabel}
                                    </span>
                                )
                            }
                        </Typography>
                    </ListItemText>
                    <ListItemIcon>
                        <IconButton onClick={handleMenuClick}>
                            <MoreHorizOutlinedIcon fontSize="small" sx={{ opacity: hovering || selected ? 1 : 0 }} />
                        </IconButton>
                    </ListItemIcon>
                </MenuItem>
            </Tooltip>
            <StyledMenu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                key={thread.id + 'menu'}
            >
                <MenuItem
                    key={thread.id + 'switch'}
                    onClick={() => switchThread(thread.id)}
                    disableRipple
                >
                    <SwapCallsIcon fontSize="small" />
                    {t('Switch')}
                </MenuItem>
                <MenuItem
                    key={thread.id + 'del'}
                    onClick={() => {
                        setAnchorEl(null)
                        handleMenuClose()
                        if (lastOne) {
                            sessionActions.removeCurrentThread(currentSessionId)
                        } else {
                            sessionActions.removeThread(currentSessionId, thread.id)
                        }
                    }}
                    disableRipple
                >
                    <DeleteIcon fontSize="small" />
                    {t('delete')}
                </MenuItem>
            </StyledMenu>
        </>
    )
}
