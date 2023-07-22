import { getDefaultStore } from 'jotai'
import * as atoms from './atoms'

export function scrollToMessageIndex(
    index: number,
    align: 'start' | 'center' | 'end' = 'start',
    behavior: 'auto' | 'smooth' = 'auto' // 'auto' 立即滚动到指定位置，'smooth' 平滑滚动到指定位置
) {
    const store = getDefaultStore()
    const virtuoso = store.get(atoms.messageScrollingAtom)
    virtuoso?.current?.scrollToIndex({ index, align, behavior })
}

export function scrollToTop(behavior: 'auto' | 'smooth' = 'auto') {
    const store = getDefaultStore()
    const currentMessages = store.get(atoms.currentMessagesAtom)
    if (currentMessages.length === 0) {
        return
    }
    return scrollToMessageIndex(0, 'start', behavior)
}

export function scrollToBottom(behavior: 'auto' | 'smooth' = 'auto') {
    const store = getDefaultStore()
    const currentMessages = store.get(atoms.currentMessagesAtom)
    if (currentMessages.length === 0) {
        return
    }
    return scrollToMessageIndex(currentMessages.length - 1, 'end', behavior)
}

export function startAutoScroll(
    index: number,
    align: 'start' | 'center' | 'end' = 'start',
    behavior: 'auto' | 'smooth' = 'auto' // 'auto' 立即滚动到指定位置，'smooth' 平滑滚动到指定位置
) {
    const store = getDefaultStore()
    const rid = [store.get(atoms.currentSessionIdAtom), Math.random().toString()].join(':')
    store.set(atoms.messageScrollingAutoMarkAtom, rid)
    scrollToMessageIndex(index, align, behavior)
    return rid
}

export function tickAutoScroll(
    autoScrollRid: string, // 用于判断是否是最新的自动滚动任务
    index: number,
    align: 'start' | 'center' | 'end' = 'start',
    behavior: 'auto' | 'smooth' = 'auto'
) {
    const store = getDefaultStore()
    // 判断是否自动滚动已经取消
    const autoScrollMark = store.get(atoms.messageScrollingAutoMarkAtom)
    if (autoScrollRid !== autoScrollMark) {
        return
    }
    // 判断是否切换了会话
    const currentSessionId = store.get(atoms.currentSessionIdAtom)
    if (currentSessionId !== autoScrollRid.split(':')[0]) {
        return
    }
    scrollToMessageIndex(index, align, behavior)
}

export function clearAutoScroll() {
    const store = getDefaultStore()
    store.set(atoms.messageScrollingAutoMarkAtom, '')
}
