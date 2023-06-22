import { getDefaultStore } from 'jotai'
import { Message } from "../types";
import * as atoms from './atoms'

export function modify(msg: Message) {
    const store = getDefaultStore()
    store.set(atoms.currentMessagesAtom, (messages) => messages.map((m) => {
        if (m.id === msg.id) {
            return msg
        }
        return m
    }))
}

export function remove(msg: Message) {
    const store = getDefaultStore()
    store.set(atoms.currentMessagesAtom, (messages) => messages.filter((m) => m.id !== msg.id))
}

export function add(...msgs: Message[]) {
    const store = getDefaultStore()
    store.set(atoms.currentMessagesAtom, (messages) => [...messages, ...msgs])
}

export function insert(msg: Message, index: number) {
    const store = getDefaultStore()
    store.set(atoms.currentMessagesAtom, (messages) => {
        const newMessages = [...messages]
        newMessages.splice(index, 0, msg)
        return newMessages
    })
}
