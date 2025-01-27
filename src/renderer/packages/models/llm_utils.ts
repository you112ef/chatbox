import { Message } from 'src/shared/types';

export function normalizeOpenAIApiHostAndPath(options: { apiHost?: string; apiPath?: string }) {
    let { apiHost, apiPath } = options
    if (apiHost) {
        apiHost = apiHost.trim()
    }
    if (apiPath) {
        apiPath = apiPath.trim()
    }
    const DEFAULT_HOST = 'https://api.openai.com/v1'
    const DEFAULT_PATH = '/chat/completions'
    // 如果 apiHost 为空，直接返回默认的 apiHost 和 apiPath
    if (!apiHost) {
        apiHost = DEFAULT_HOST
        apiPath = DEFAULT_PATH
        return { apiHost, apiPath }
    }
    // 处理前后 '/' 的干扰
    if (apiHost.endsWith('/')) {
        apiHost = apiHost.slice(0, -1)
    }
    if (apiPath && !apiPath.startsWith('/')) {
        apiPath = '/' + apiPath
    }
    // https 协议
    if (apiHost && !apiHost.startsWith('http://') && !apiHost.startsWith('https://')) {
        apiHost = 'https://' + apiHost
    }
    // 如果用户在 host 配置了完整的 host+path 接口地址
    // 可以兼容的输入情况有：
    //   apiHost=https://my.proxy.com/v1/chat/completions
    if (apiHost.endsWith(DEFAULT_PATH)) {
        apiHost = apiHost.replace(DEFAULT_PATH, '')
        apiPath = DEFAULT_PATH
    }
    // 如果当前配置的是 OpenAI 的 API，统一为默认的 apiHost 和 apiPath
    if (apiHost.endsWith('://api.openai.com') || apiHost.endsWith('://api.openai.com/v1')) {
        apiHost = DEFAULT_HOST
        apiPath = DEFAULT_PATH
        return { apiHost, apiPath }
    }
    // 如果当前配置的是 OpenRouter 的 API，统一 apiHost 和 apiPath
    if (apiHost.endsWith('://openrouter.ai') || apiHost.endsWith('://openrouter.ai/api')) {
        apiHost = 'https://openrouter.ai/api/v1'
        apiPath = DEFAULT_PATH
        return { apiHost, apiPath }
    }
    // 如果当前配置的是 x 的 API，统一 apiHost 和 apiPath
    if (apiHost.endsWith('://api.x.com') || apiHost.endsWith('://api.x.com/v1')) {
        apiHost = 'https://api.x.com/v1'
        apiPath = DEFAULT_PATH
        return { apiHost, apiPath }
    }
    // 如果只配置 apiHost，且 apiHost 不以 /v1 结尾
    if (!apiHost.endsWith('/v1') && !apiPath) {
        apiHost = apiHost + '/v1'
        apiPath = DEFAULT_PATH
    }
    if (!apiPath) {
        apiPath = DEFAULT_PATH
    }
    return { apiHost, apiPath }
}

// 避免同一个角色的消息连续出现，如果连续出现则合并内容
export function fixMessageRoleSequence(messages: Message[]): Message[] {
    let result: Message[] = []
    if (messages.length <= 1) {
        result = messages
    } else {
        // 如果同一个角色的消息连续出现，则合并内容
        let currentMessage = { ...messages[0] } // 复制，避免后续修改导致的引用问题
        for (let i = 1; i < messages.length; i++) {
            const message = messages[i]
            if (message.role === currentMessage.role) {
                currentMessage.content += '\n\n' + message.content
            } else {
                result.push(currentMessage)
                currentMessage = { ...message }
            }
        }
        result.push(currentMessage)
    }
    // 如果顺序中的第一条 assistant 消息前面不是 user 消息，则插入一个 user 消息
    const firstAssistantIndex = result.findIndex(m => m.role === 'assistant')
    if (firstAssistantIndex !== -1 && result[firstAssistantIndex - 1]?.role !== 'user') {
        result = [
            ...result.slice(0, firstAssistantIndex),
            { role: 'user', content: 'OK.', id: 'user_before_assistant_id' },
            ...result.slice(firstAssistantIndex),
        ]
    }
    return result
}
