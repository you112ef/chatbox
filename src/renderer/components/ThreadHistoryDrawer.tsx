import { useEffect, useRef, useState } from 'react'
import { currentThreadHistoryHashAtom, currentSessionIdAtom, showThreadHistoryDrawerAtom } from "@/stores/atoms"
import { Tooltip, Box, Drawer, MenuList, MenuItem, ListItemText, Typography, ListItemIcon, IconButton } from "@mui/material"
import { useAtom, useAtomValue } from "jotai"
import { scrollToMessage } from "@/stores/scrollActions";
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { SessionThreadBrief } from 'src/shared/types';
import AddCommentIcon from '@mui/icons-material/AddComment';
import * as sessionActions from '../stores/sessionActions'
import { useTranslation } from 'react-i18next';

interface Props {
}

export default function ThreadHistoryDrawer(props: Props) {
    const { t } = useTranslation()
    const [showDrawer, setShowDrawer] = useAtom(showThreadHistoryDrawerAtom)
    const currentThreadHistoryHash = useAtomValue(currentThreadHistoryHashAtom)
    const currentSessionId = useAtomValue(currentSessionIdAtom)

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
            <Box sx={{ padding: '1rem 0.5rem 0.2rem 0.5rem', margin: '0.1rem 0.1rem 0.1rem 0.2rem' }} >
                <span className="text-xs opacity-80">{t('Threads History')}</span>
            </Box>
            <MenuList
                sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'auto',
                    '& ul': { padding: 0 },
                    paddingX: '0.5rem',
                    paddingY: '0',
                }}
                className="w-full"
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
                        />
                    )}
                />
            </MenuList>
        </Drawer>
    )
}

function ThreadItem(props: {
    thread: SessionThreadBrief
    goto(threadId: string): void
    showHistoryDrawer: string | boolean
    switchThread(threadId: string): void
}) {
    const { t } = useTranslation()
    const { thread, goto, showHistoryDrawer, switchThread } = props
    const [hovering, setHovering] = useState(false)
    const selected = thread.id === showHistoryDrawer
    const threadName = thread.name || t('New Thread')
    return (
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
                <Tooltip title={`${threadName} ${(thread.createdAtLabel || '').toLocaleString()}`} placement="top">
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
                </Tooltip>
            </ListItemText>
            <ListItemIcon>
                <Tooltip title={t('Continue this Thread')} placement="top">
                    <IconButton onClick={() => switchThread(thread.id)}>
                        <AddCommentIcon fontSize='small'
                            sx={{ opacity: hovering || selected ? 1 : 0 }}
                        />
                    </IconButton>
                </Tooltip>
            </ListItemIcon>
        </MenuItem>
    )
}
