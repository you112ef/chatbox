// 有时候直接操作 DOM 依然是最方便、性能最好的方式，这里对 DOM 操作进行统一管理

export const messageInputID = 'message-input'

export const focusMessageInput = () => {
    document.getElementById(messageInputID)?.focus()
}

// 将光标位置设置为文本末尾
export function setMessageInputCursorToEnd() {
    const dom = document.getElementById(messageInputID) as HTMLInputElement
    if (!dom) {
        return
    }
    dom.selectionStart = dom.selectionEnd = dom.value.length
    setTimeout(() => {
        dom.scrollTop = dom.scrollHeight
    }, 20) // 等待 React 状态更新
}
