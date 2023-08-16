import { useEffect, useRef } from 'react'
import Message from './Message'
import * as atoms from '../stores/atoms'
import { useAtomValue, useSetAtom } from 'jotai'
import { Virtuoso } from 'react-virtuoso'
import { List } from '@mui/material'
import { VirtuosoHandle } from 'react-virtuoso'
import * as scrollActions from '../stores/scrollActions'

interface Props { }

export default function MessageList(props: Props) {
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const currentMessages = useAtomValue(atoms.currentMessagesAtom)
    const virtuoso = useRef<VirtuosoHandle>(null)
    const messageListRef = useRef<HTMLDivElement>(null)

    const setMessageScrollingAtom = useSetAtom(atoms.messageScrollingAtom)
    const setAtTop = useSetAtom(atoms.messageScrollingAtTopAtom)
    const setAtBottom = useSetAtom(atoms.messageScrollingAtBottomAtom)
    const setMessageScrollingScrollPosition = useSetAtom(atoms.messageScrollingScrollPositionAtom)

    useEffect(() => {
        setMessageScrollingAtom(virtuoso)
    }, [virtuoso])

    return (
        <List
            className="scroll"
            sx={{
                bgcolor: 'background.paper',
                overflow: 'auto',
                '& ul': { padding: 0 },
                height: '100%',
            }}
            component="div"
            ref={messageListRef}
        >
            <Virtuoso
                data={currentMessages}
                atTopStateChange={(atTop) => {
                    setAtTop(atTop)
                }}
                atBottomStateChange={(atBottom) => {
                    setAtBottom(atBottom)
                }}
                ref={virtuoso}
                itemContent={(index, msg) => {
                    return (
                        <Message id={msg.id} key={msg.id} msg={msg} sessionId={currentSession.id} />
                    )
                }}
                onWheel={(e) => {
                    scrollActions.clearAutoScroll()
                    if (virtuoso.current) {
                        virtuoso.current.getState(state => {
                            if (messageListRef.current) {
                                setMessageScrollingScrollPosition(state.scrollTop + messageListRef.current.clientHeight)
                            }
                        })
                    }
                }}
                totalListHeightChanged={() => {
                    if (virtuoso.current) {
                        virtuoso.current.getState(state => {
                            if (messageListRef.current) {
                                setMessageScrollingScrollPosition(state.scrollTop + messageListRef.current.clientHeight)
                            }
                        })
                    }
                }}
            />
        </List>
    )
}
