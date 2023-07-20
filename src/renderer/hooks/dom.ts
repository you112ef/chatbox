// 有时候直接操作 DOM 依然是最方便、性能最好的方式，这里对 DOM 操作进行统一管理

export const messageInputID = 'message-input'

export const focusMessageInput = () => {
    document.getElementById(messageInputID)?.focus()
}
