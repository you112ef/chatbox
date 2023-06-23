import { MutableRefObject } from 'react';
import { getDefaultStore } from 'jotai';
import {
    createMessage,
    Message,
    Session,
    getEmptySession,
    getMsgDisplayModelName,
} from '../types';
import * as atoms from './atoms';
import * as client from '../client';
import i18n from 'i18next';

export function modify(update: Session) {
    const store = getDefaultStore();
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === update.id) {
                return update;
            }
            return s;
        })
    );
}

export function modifyName(sessionId: string, name: string) {
    const store = getDefaultStore();
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return { ...s, name };
            }
            return s;
        })
    );
}

export function createEmptyThenSwitch() {
    const store = getDefaultStore();
    const session = getEmptySession();
    store.set(atoms.currentSessionAtom, session);
}

export function remove(session: Session) {
    const store = getDefaultStore();
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.filter((s) => s.id !== session.id)
    );
}

export function copy(source: Session) {
    const store = getDefaultStore();
    const newSession = { ...source };
    newSession.id = getEmptySession().id;
    store.set(atoms.sessionsAtom, (sessions) => [...sessions, newSession]);
}

export function getSession(sessionId: string) {
    const store = getDefaultStore();
    const sessions = store.get(atoms.sessionsAtom);
    return sessions.find((s) => s.id === sessionId);
}

export function insertMessage(sessionId: string, msg: Message, index?: number) {
    const store = getDefaultStore();
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                const newMessages = [...s.messages];
                if (index === undefined) {
                    newMessages.push(msg);
                } else {
                    newMessages.splice(index, 0, msg);
                }
                return {
                    ...s,
                    messages: newMessages,
                };
            }
            return s;
        })
    );
}

export function modifyMessage(sessionId: string, updated: Message) {
    const store = getDefaultStore();
    store.set(atoms.sessionsAtom, (sessions) =>
        sessions.map((s) => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    messages: s.messages.map((m) => {
                        if (m.id === updated.id) {
                            return updated;
                        }
                        return m;
                    }),
                };
            }
            return s;
        })
    );
}

export async function generate(
    sessionId: string,
    targetMsg: Message,
    messageScrollRef: MutableRefObject<{
        msgId: string;
        smooth?: boolean | undefined;
    } | null>
) {
    const store = getDefaultStore();
    const settings = store.get(atoms.settingsAtom);
    const configs = store.get(atoms.configsAtom);
    const session = getSession(sessionId);
    if (!session) {
        return;
    }
    targetMsg = {
        ...targetMsg,
        content: '...',
        cancel: undefined,
        model: getMsgDisplayModelName(settings),
        generating: true,
    };
    modifyMessage(sessionId, targetMsg);

    const msgIx = session.messages.findIndex((m) => m.id === targetMsg.id);
    if (msgIx < 0) {
        return;
    }
    const promptMsgs = session.messages.slice(0, msgIx);

    messageScrollRef.current = { msgId: targetMsg.id, smooth: false };
    await client.reply(
        settings,
        configs,
        promptMsgs,
        ({ text, cancel }) => {
            targetMsg = {
                ...targetMsg,
                content: text,
                cancel,
                model: getMsgDisplayModelName(settings),
                generating: true,
            };
            modifyMessage(sessionId, targetMsg);
        },
        (err) => {
            targetMsg = {
                ...targetMsg,
                content:
                    i18n.t('api request failed:') +
                    ' \n```\n' +
                    err.message +
                    '\n```',
                model: getMsgDisplayModelName(settings),
                generating: false,
            };
            modifyMessage(sessionId, targetMsg);
        }
    );
    targetMsg = {
        ...targetMsg,
        generating: false,
    };
    modifyMessage(sessionId, targetMsg);

    messageScrollRef.current = null;
}

export async function refreshMessage(
    sessionId: string,
    msg: Message,
    messageScrollRef: MutableRefObject<{
        msgId: string;
        smooth?: boolean | undefined;
    } | null>
) {
    if (msg.role === 'assistant') {
        await generate(sessionId, msg, messageScrollRef);
    } else {
        const session = getSession(sessionId);
        const ix = session?.messages.findIndex((m) => m.id === msg.id) ?? -1;
        const newAssistantMsg = createMessage('assistant', '....');
        insertMessage(sessionId, newAssistantMsg, ix + 1);
        messageScrollRef.current = { msgId: newAssistantMsg.id, smooth: true };
        await generate(sessionId, newAssistantMsg, messageScrollRef);
    }
}
