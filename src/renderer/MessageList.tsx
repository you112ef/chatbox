import React, { useEffect, useRef } from 'react';
import Block from './Block';
import * as atoms from './stores/atoms';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

interface Props {
    messageScrollRef: React.MutableRefObject<{
        msgId: string;
        smooth?: boolean;
    } | null>;
}

export default function MessageList(props: Props) {
    const currentSession = useAtomValue(atoms.currentSessionAtom);
    const currentMessages = useAtomValue(atoms.currentMessagesAtom);
    return (
        <>
            {currentMessages.map((msg, ix) => (
                <Block
                    id={msg.id}
                    key={msg.id}
                    msg={msg}
                    sessionId={currentSession.id}
                    messageScrollRef={props.messageScrollRef}
                />
            ))}
        </>
    );
}
