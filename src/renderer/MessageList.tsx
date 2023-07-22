import { useState, useEffect, useRef } from 'react'
import Block from './Block'
import * as atoms from './stores/atoms'
import { useAtomValue, useSetAtom } from 'jotai'
import { Virtuoso } from 'react-virtuoso'
import { List } from '@mui/material'
import { VirtuosoHandle } from 'react-virtuoso'
import * as scrollActions from './stores/scrollActions'

interface Props {}

export default function MessageList(props: Props) {
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const currentMessages = useAtomValue(atoms.currentMessagesAtom)
    const virtuoso = useRef<VirtuosoHandle>(null)
    const messageListRef = useRef<HTMLDivElement>(null)

    const setMessageScrollingAtom = useSetAtom(atoms.messageScrollingAtom)
    const setAtTop = useSetAtom(atoms.messageScrollingAtTopAtom)
    const setAtBottom = useSetAtom(atoms.messageScrollingAtBottomAtom)

    useEffect(() => {
        setMessageScrollingAtom(virtuoso)
    }, [virtuoso])

    // stop auto-scroll when user scroll
    useEffect(() => {
        if (!messageListRef.current) {
            return
        }
        messageListRef.current.addEventListener('wheel', function (e: any) {
            scrollActions.clearAutoScroll()
        })
    }, [])

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
                    return <Block id={msg.id} key={msg.id} msg={msg} sessionId={currentSession.id} />
                }}
            />
        </List>
    )
}
