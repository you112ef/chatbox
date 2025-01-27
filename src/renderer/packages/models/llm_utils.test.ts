import { normalizeOpenAIApiHostAndPath } from './llm_utils'
import { fixMessageRoleSequence } from './llm_utils'
import { Message } from 'src/shared/types'

describe('normalizeOpenAIApiHostAndPath', () => {
    it('默认值', () => {
        const result = normalizeOpenAIApiHostAndPath({})
        expect(result).toEqual({ apiHost: 'https://api.openai.com/v1', apiPath: '/chat/completions' })
    })

    it('OpenAI API', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://api.openai.com/v1', apiPath: '/chat/completions' })
        expect(result).toEqual({ apiHost: 'https://api.openai.com/v1', apiPath: '/chat/completions' })
    })
    it('OpenAI API 2', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://api.openai.com/v1' })
        expect(result).toEqual({ apiHost: 'https://api.openai.com/v1', apiPath: '/chat/completions' })
    })
    it('OpenAI API 3', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://api.openai.com' })
        expect(result).toEqual({ apiHost: 'https://api.openai.com/v1', apiPath: '/chat/completions' })
    })
    it('OpenAI API 4', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://api.openai.com/v1/chat/completions' })
        expect(result).toEqual({ apiHost: 'https://api.openai.com/v1', apiPath: '/chat/completions' })
    })
    it('OpenAI API 4', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://api.openai.com/', apiPath: '/v1/chat/completions' })
        expect(result).toEqual({ apiHost: 'https://api.openai.com/v1', apiPath: '/chat/completions' })
    })

    it('OpenRouter API 1', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://openrouter.ai/api/v1', apiPath: '/chat/completions' })
        expect(result).toEqual({ apiHost: 'https://openrouter.ai/api/v1', apiPath: '/chat/completions' })
    })
    it('OpenRouter API 2', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://openrouter.ai/api/v1' })
        expect(result).toEqual({ apiHost: 'https://openrouter.ai/api/v1', apiPath: '/chat/completions' })
    })
    it('OpenRouter API 3', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://openrouter.ai/api' })
        expect(result).toEqual({ apiHost: 'https://openrouter.ai/api/v1', apiPath: '/chat/completions' })
    })
    it('OpenRouter API 4', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://openrouter.ai/api/v1/chat/completions/' })
        expect(result).toEqual({ apiHost: 'https://openrouter.ai/api/v1', apiPath: '/chat/completions' })
    })

    it('xAPI 1', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://api.x.com/v1', apiPath: '/chat/completions' })
        expect(result).toEqual({ apiHost: 'https://api.x.com/v1', apiPath: '/chat/completions' })
    })
    it('xAPI 2', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://api.x.com/v1' })
        expect(result).toEqual({ apiHost: 'https://api.x.com/v1', apiPath: '/chat/completions' })
    })
    it('xAPI 3', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://api.x.com' })
        expect(result).toEqual({ apiHost: 'https://api.x.com/v1', apiPath: '/chat/completions' })
    })
    it('xAPI 4', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://api.x.com/v1/chat/completions/' })
        expect(result).toEqual({ apiHost: 'https://api.x.com/v1', apiPath: '/chat/completions' })
    })
    it('xAPI 5', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://api.x.com', apiPath: '/chat/completions' })
        expect(result).toEqual({ apiHost: 'https://api.x.com/v1', apiPath: '/chat/completions' })
    })

    it('自定义代理地址', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://my-proxy.com' })
        expect(result).toEqual({ apiHost: 'https://my-proxy.com/v1', apiPath: '/chat/completions' })
    })
    it('自定义代理地址带完整路径', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://my-proxy.com/v1/chat/completions' })
        expect(result).toEqual({ apiHost: 'https://my-proxy.com/v1', apiPath: '/chat/completions' })
    })
    it('自定义 API 路径', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://my-proxy.com', apiPath: '/custom/path' })
        expect(result).toEqual({ apiHost: 'https://my-proxy.com', apiPath: '/custom/path' })
    })

    it('斜杠 1', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://my-proxy.com/', apiPath: '/chat/completions' })
        expect(result).toEqual({ apiHost: 'https://my-proxy.com', apiPath: '/chat/completions' })
    })
    it('斜杠 2', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://my-proxy.com', apiPath: 'custom/path' })
        expect(result).toEqual({ apiHost: 'https://my-proxy.com', apiPath: '/custom/path' })
    })

    it('http 协议', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'http://my-proxy.com', apiPath: '/chat/completions' })
        expect(result).toEqual({ apiHost: 'http://my-proxy.com', apiPath: '/chat/completions' })
    })
    it('http 协议 2', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'https://my-proxy.com', apiPath: '/chat/completions' })
        expect(result).toEqual({ apiHost: 'https://my-proxy.com', apiPath: '/chat/completions' })
    })
    it('http 协议 3', () => {
        const result = normalizeOpenAIApiHostAndPath({ apiHost: 'my-proxy.com', apiPath: '/chat/completions' })
        expect(result).toEqual({ apiHost: 'https://my-proxy.com', apiPath: '/chat/completions' })
    })
})

describe('fixMessageRoleSequence', () => {
    it('应该处理空数组', () => {
        const messages: Message[] = []
        expect(fixMessageRoleSequence(messages)).toEqual([])
    })

    it('应该处理单条消息', () => {
        const messages: Message[] = [
            { id: '', role: 'user', content: '你好' }
        ]
        expect(fixMessageRoleSequence(messages)).toEqual([
            { id: '', role: 'user', content: '你好' }
        ])
    })

    it('应该合并连续的相同角色消息', () => {
        const messages: Message[] = [
            { id: '', role: 'user', content: '你好' },
            { id: '', role: 'user', content: '请问一下' }
        ]
        expect(fixMessageRoleSequence(messages)).toEqual([
            { id: '', role: 'user', content: '你好\n\n请问一下' }
        ])
    })

    it('应该正确处理交替的角色消息', () => {
        const messages: Message[] = [
            { id: '', role: 'user', content: '你好' },
            { id: '', role: 'assistant', content: '你好！有什么可以帮你的？' },
            { id: '', role: 'user', content: '请问一下' }
        ]
        expect(fixMessageRoleSequence(messages)).toEqual([
            { id: '', role: 'user', content: '你好' },
            { id: '', role: 'assistant', content: '你好！有什么可以帮你的？' },
            { id: '', role: 'user', content: '请问一下' }
        ])
    })

    it('应该处理多个连续相同角色的消息', () => {
        const messages: Message[] = [
            { id: '', role: 'user', content: '你好' },
            { id: '', role: 'assistant', content: '你好！' },
            { id: '', role: 'assistant', content: '有什么可以帮你的？' },
            { id: '', role: 'assistant', content: '请随时告诉我' },
            { id: '', role: 'user', content: '谢谢' }
        ]
        expect(fixMessageRoleSequence(messages)).toEqual([
            { id: '', role: 'user', content: '你好' },
            { id: '', role: 'assistant', content: '你好！\n\n有什么可以帮你的？\n\n请随时告诉我' },
            { id: '', role: 'user', content: '谢谢' }
        ])
    })

    it('应该在第一条 assistant 消息前添加 user 消息', () => {
        const messages: Message[] = [
            { role: 'system', content: 'System prompt', id: '1' },
            { role: 'assistant', content: 'Hello', id: '2' }
        ]
        const expected: Message[] = [
            { role: 'system', content: 'System prompt', id: '1' },
            { role: 'user', content: 'OK.', id: 'user_before_assistant_id' },
            { role: 'assistant', content: 'Hello', id: '2' }
        ]
        expect(fixMessageRoleSequence(messages)).toEqual(expected)
    })
    it('应该在第一条 assistant 消息前添加 user 消息', () => {
        const messages: Message[] = [
            { role: 'assistant', content: 'Hello', id: '2' }
        ]
        const expected: Message[] = [
            { role: 'user', content: 'OK.', id: 'user_before_assistant_id' },
            { role: 'assistant', content: 'Hello', id: '2' }
        ]
        expect(fixMessageRoleSequence(messages)).toEqual(expected)
    })

    it('不应该在已有 user 消息后的 assistant 消息前添加新的 user 消息', () => {
        const messages: Message[] = [
            { role: 'user', content: 'Hello', id: '1' },
            { role: 'assistant', content: 'Hi', id: '2' }
        ]
        expect(fixMessageRoleSequence(messages)).toEqual(messages)
    })

    it('应该正确处理多组对话', () => {
        const messages: Message[] = [
            { role: 'system', content: 'System prompt', id: '1' },
            { role: 'user', content: 'Hello', id: '2' },
            { role: 'assistant', content: 'Hi', id: '3' },
            { role: 'assistant', content: 'How are you?', id: '4' },
            { role: 'user', content: 'Good', id: '5' }
        ]
        const expected: Message[] = [
            { role: 'system', content: 'System prompt', id: '1' },
            { role: 'user', content: 'Hello', id: '2' },
            { role: 'assistant', content: 'Hi\n\nHow are you?', id: '3' },
            { role: 'user', content: 'Good', id: '5' }
        ]
        expect(fixMessageRoleSequence(messages)).toEqual(expected)
    })

})
