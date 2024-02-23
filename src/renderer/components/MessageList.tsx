import { useEffect, useRef } from 'react'
import Message from './Message'
import * as atoms from '../stores/atoms'
import { useAtomValue, useSetAtom } from 'jotai'
import { Virtuoso } from 'react-virtuoso'
import { Divider } from '@mui/material'
import { VirtuosoHandle } from 'react-virtuoso'
import * as scrollActions from '../stores/scrollActions'
import { useTranslation } from 'react-i18next'
import * as dom from '@/hooks/dom'
import { useIsSmallScreen } from '@/hooks/useScreenChange'

interface Props { }

export default function MessageList(props: Props) {
    const { t } = useTranslation()
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const currentMessageList = useAtomValue(atoms.currentMessageListAtom)
    const currentThreadHash = useAtomValue(atoms.currentThreadHistoryHashAtom)
    const virtuoso = useRef<VirtuosoHandle>(null)
    const messageListRef = useRef<HTMLDivElement>(null)

    const setMessageScrollingAtom = useSetAtom(atoms.messageScrollingAtom)
    const setAtTop = useSetAtom(atoms.messageScrollingAtTopAtom)
    const setAtBottom = useSetAtom(atoms.messageScrollingAtBottomAtom)
    const setMessageScrollingScrollPosition = useSetAtom(atoms.messageScrollingScrollPositionAtom)
    const setShowHistoryDrawer = useSetAtom(atoms.showThreadHistoryDrawerAtom)

    useEffect(() => {
        setMessageScrollingAtom(virtuoso)
    }, [virtuoso])

    // 当历史 threads 发生变化时，自动滚动到底部
    const isSmallScreen = useIsSmallScreen()
    useEffect(() => {
        setTimeout(() => {
            scrollActions.scrollToBottom() // 自动滚动到底部
            if (! isSmallScreen) {
                dom.focusMessageInput() // 除了在小屏幕，否则自动聚焦到输入框
            }
        }, 100);
    }, [currentSession.threads])

    return (
        <div className='overflow-auto h-full pr-0 pl-1 sm:pl-0' ref={messageListRef}>
            <Virtuoso
                data={currentMessageList}
                atTopStateChange={(atTop) => {
                    setAtTop(atTop)
                }}
                atBottomStateChange={(atBottom) => {
                    setAtBottom(atBottom)
                }}
                ref={virtuoso}
                itemContent={(index, msg) => {
                    return (
                        // <div key={msg.id}>
                        <>
                            {
                                index !== 0 && currentThreadHash[msg.id] && (
                                    <div className='text-center pb-4 pt-8' key={'divider-' + msg.id}
                                    >
                                        <span className='cursor-pointer font-bold border-solid border rounded-2xl py-2 px-3 border-slate-400/25'
                                            onClick={() => setShowHistoryDrawer(currentThreadHash[msg.id].id)}
                                        >
                                            #
                                            {
                                                currentThreadHash[msg.id].name
                                                || t('New Thread')
                                            }
                                            {
                                                currentThreadHash[msg.id].createdAtLabel && (
                                                    <span className="pl-1 opacity-70">
                                                        {currentThreadHash[msg.id].createdAtLabel}
                                                    </span>
                                                )
                                            }
                                        </span>
                                    </div>
                                )
                            }
                            <Message
                                id={msg.id}
                                key={'msg-' + msg.id}
                                msg={msg}
                                sessionId={currentSession.id}
                                sessionType={currentSession.type}
                            />
                        </>
                        // </div>
                    )
                }}
                onWheel={(e) => {
                    scrollActions.clearAutoScroll()
                }}
                onScroll={(e) => {
                    // 为什么不合并到 onWheel 中？
                    // 实践中发现 onScroll 处理时效果会更加丝滑一些
                    if (virtuoso.current) {
                        virtuoso.current.getState((state) => {
                            if (messageListRef.current) {
                                setMessageScrollingScrollPosition(state.scrollTop + messageListRef.current.clientHeight)
                            }
                        })
                    }
                }}
                totalListHeightChanged={() => {
                    if (virtuoso.current) {
                        virtuoso.current.getState((state) => {
                            if (messageListRef.current) {
                                setMessageScrollingScrollPosition(state.scrollTop + messageListRef.current.clientHeight)
                            }
                        })
                    }
                }}
            />
        </div>
    )
}
