import { useEffect, useRef, useState } from 'react'
import Message from './Message'
import * as atoms from '../stores/atoms'
import { useAtomValue, useSetAtom } from 'jotai'
import { Virtuoso } from 'react-virtuoso'
import { VirtuosoHandle } from 'react-virtuoso'
import * as scrollActions from '../stores/scrollActions'
import * as sessionActions from '../stores/sessionActions'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import StyledMenu from './StyledMenu'
import { MenuItem, useTheme, IconButton } from '@mui/material'
import SwapCallsIcon from '@mui/icons-material/SwapCalls'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import SegmentIcon from '@mui/icons-material/Segment'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Session } from 'src/shared/types'

interface Props {}

export default function MessageList(props: Props) {
    const { t } = useTranslation()
    const theme = useTheme()

    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const currentMessageList = useAtomValue(atoms.currentMessageListAtom)
    const currentThreadHash = useAtomValue(atoms.currentThreadHistoryHashAtom)
    const virtuoso = useRef<VirtuosoHandle>(null)
    const messageListRef = useRef<HTMLDivElement>(null)

    const setMessageListElement = useSetAtom(atoms.messageListElementAtom)
    const setMessageScrollingAtom = useSetAtom(atoms.messageScrollingAtom)
    const setAtTop = useSetAtom(atoms.messageScrollingAtTopAtom)
    const setAtBottom = useSetAtom(atoms.messageScrollingAtBottomAtom)
    const setMessageScrollingScrollPosition = useSetAtom(atoms.messageScrollingScrollPositionAtom)
    const setShowHistoryDrawer = useSetAtom(atoms.showThreadHistoryDrawerAtom)

    useEffect(() => {
        setMessageScrollingAtom(virtuoso)
    }, [])
    useEffect(() => {
        setMessageListElement(messageListRef)
    }, [])

    const [threadMenuAnchorEl, setThreadMenuAnchorEl] = useState<null | HTMLElement>(null)
    const [threadMenuClickedTopicId, setThreadMenuClickedTopicId] = useState<null | string>(null)
    const [threadMenuDelete, setThreadMenuDelete] = useState<boolean>(false)
    const openThreadMenu = (event: React.MouseEvent<HTMLElement>, topicId: string) => {
        setThreadMenuAnchorEl(event.currentTarget)
        setThreadMenuClickedTopicId(topicId)
        setThreadMenuDelete(false)
    }
    const closeThreadMenu = () => {
        setThreadMenuAnchorEl(null)
        setThreadMenuClickedTopicId(null)
        setThreadMenuDelete(false)
    }

    return (
        <div className={cn('w-full h-full mx-auto')}>
            <div className="overflow-auto h-full pr-0 pl-1 sm:pl-0" ref={messageListRef}>
                <Virtuoso
                    data={currentMessageList}
                    atTopStateChange={(atTop) => {
                        setAtTop(atTop)
                    }}
                    atBottomStateChange={(atBottom) => {
                        setAtBottom(atBottom)
                    }}
                    ref={virtuoso}
                    increaseViewportBy={{ top: 500, bottom: 500 }}
                    itemContent={(index, msg) => {
                        return (
                            // <div key={msg.id}>
                            <>
                                {index !== 0 && currentThreadHash[msg.id] && (
                                    <div className="text-center pb-4 pt-8" key={'divider-' + msg.id}>
                                        <span
                                            className="cursor-pointer font-bold border-solid border rounded-2xl py-2 px-3 border-slate-400/25"
                                            onClick={(event) => openThreadMenu(event, currentThreadHash[msg.id].id)}
                                        >
                                            <span className="pr-1 opacity-60">#</span>
                                            {currentThreadHash[msg.id].name || t('New Thread')}
                                            {currentThreadHash[msg.id].createdAtLabel && (
                                                <span className="pl-1 opacity-60 text-xs">
                                                    {currentThreadHash[msg.id].createdAtLabel}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                )}
                                <Message
                                    id={msg.id}
                                    key={'msg-' + msg.id}
                                    msg={msg}
                                    sessionId={currentSession.id}
                                    sessionType={currentSession.type || 'chat'}
                                    className={index === 0 ? 'pt-4' : ''}
                                    collapseThreshold={msg.role === 'system' ? 150 : undefined}
                                    preferCollapsedCodeBlock={index < currentMessageList.length - 10}
                                />
                                {currentSession.messageForksHash?.[msg.id] && (
                                    <ForkNav
                                        key={`fork_nav_${msg.id}`}
                                        msgId={msg.id}
                                        forks={currentSession.messageForksHash?.[msg.id]}
                                    />
                                )}
                            </>
                            // </div>
                        )
                    }}
                    onWheel={(e) => {
                        scrollActions.clearAutoScroll() // 鼠标滚轮滚动时，清除自动滚动
                    }}
                    onTouchMove={(e) => {
                        scrollActions.clearAutoScroll() // 手机上触摸屏幕滑动时，清除自动滚动
                    }}
                    onScroll={(e) => {
                        // 为什么不合并到 onWheel 中？
                        // 实践中发现 onScroll 处理时效果会更加丝滑一些
                        if (virtuoso.current) {
                            virtuoso.current.getState((state) => {
                                if (messageListRef.current) {
                                    setMessageScrollingScrollPosition(
                                        state.scrollTop + messageListRef.current.clientHeight
                                    )
                                }
                            })
                        }
                    }}
                    totalListHeightChanged={() => {
                        if (virtuoso.current) {
                            virtuoso.current.getState((state) => {
                                if (messageListRef.current) {
                                    setMessageScrollingScrollPosition(
                                        state.scrollTop + messageListRef.current.clientHeight
                                    )
                                }
                            })
                        }
                    }}
                />
                <StyledMenu
                    anchorEl={threadMenuAnchorEl}
                    open={Boolean(threadMenuAnchorEl)}
                    onClose={closeThreadMenu}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                >
                    <MenuItem
                        disableRipple
                        onClick={() => {
                            setShowHistoryDrawer(threadMenuClickedTopicId || true)
                            closeThreadMenu()
                        }}
                    >
                        <SegmentIcon fontSize="small" />
                        {t('Show in Thread List')}
                    </MenuItem>
                    <MenuItem
                        disableRipple
                        divider
                        onClick={() => {
                            if (threadMenuClickedTopicId) {
                                sessionActions.switchThread(currentSession.id, threadMenuClickedTopicId)
                            }
                            closeThreadMenu()
                        }}
                    >
                        <SwapCallsIcon fontSize="small" />
                        {t('Continue this thread')}
                    </MenuItem>
                    {threadMenuDelete ? (
                        <MenuItem
                            disableRipple
                            onClick={() => {
                                if (threadMenuClickedTopicId) {
                                    sessionActions.removeThread(currentSession.id, threadMenuClickedTopicId)
                                }
                                closeThreadMenu()
                            }}
                            sx={{
                                color: theme.palette.error.contrastText,
                                backgroundColor: theme.palette.error.main,
                                '&:hover': {
                                    color: theme.palette.error.contrastText,
                                    backgroundColor: theme.palette.error.main,
                                },
                            }}
                        >
                            <CheckIcon fontSize="small" />
                            {t('Confirm deletion?')}
                        </MenuItem>
                    ) : (
                        <MenuItem
                            disableRipple
                            onClick={() => {
                                setThreadMenuDelete(true)
                            }}
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                },
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                            {t('delete')}
                        </MenuItem>
                    )}
                </StyledMenu>
            </div>
        </div>
    )
}

function ForkNav(props: { msgId: string; forks: NonNullable<Session['messageForksHash']>[string] }) {
    const { msgId, forks } = props
    const widthFull = useAtomValue(atoms.widthFullAtom)
    const [flash, setFlash] = useState(false)
    const prevLength = useRef(forks.lists.length)

    useEffect(() => {
        if (forks.lists.length > prevLength.current) {
            setFlash(true)
            const timer = setTimeout(() => setFlash(false), 2000)
            return () => clearTimeout(timer)
        }
        prevLength.current = forks.lists.length
    }, [forks.lists.length])

    return (
        <div className={cn('flex items-center justify-end', widthFull ? 'w-full' : 'max-w-4xl mx-auto')}>
            <div
                className={cn(
                    'mt-[-35px] pr-4 inline-flex items-center gap-2',
                    'opacity-50 hover:opacity-100',
                    flash && 'animate-flash opacity-100 font-bold'
                )}
            >
                <IconButton
                    aria-label="fork-left"
                    size="small"
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                    onClick={() => sessionActions.switchFork(msgId, 'prev')}
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </IconButton>
                <div className="flex items-center gap-1 text-xs">
                    <span>{forks.position + 1}</span>
                    <span>/</span>
                    <span>{forks.lists.length}</span>
                </div>
                <IconButton
                    aria-label="fork-right"
                    size="small"
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                    onClick={() => sessionActions.switchFork(msgId, 'next')}
                >
                    <ChevronRightIcon className="w-5 h-5" />
                </IconButton>
            </div>
        </div>
    )
}
