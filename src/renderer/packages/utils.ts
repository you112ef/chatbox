import * as Sentry from '@sentry/react'
import GPT3Tokenizer from 'gpt3-tokenizer'
import { Message } from '../../shared/types'

/**
 * Word Count
 *
 * Word count in respect of CJK characters.
 *
 * Copyright (c) 2015 - 2016 by Hsiaoming Yang.
 *
 * https://github.com/yuehu/word-count
 */
var pattern =
    /[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff\u0400-\u04ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g
export function countWord(data: string): number {
    try {
        data = typeof data === 'string' ? data : JSON.stringify(data)
        var m = data.match(pattern)
        var count = 0
        if (!m) {
            return 0
        }
        for (var i = 0; i < m.length; i++) {
            if (m[i].charCodeAt(0) >= 0x4e00) {
                count += m[i].length
            } else {
                count += 1
            }
        }
        return count
    } catch (e) {
        Sentry.captureException(e)
        return -1
    }
}

const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })

function estimateTokens(str: string): number {
    str = typeof str === 'string' ? str : JSON.stringify(str)
    const encoded: { bpe: number[]; text: string[] } = tokenizer.encode(str)
    return encoded.bpe.length
}

// 参考: https://github.com/pkoukk/tiktoken-go#counting-tokens-for-chat-api-calls
// OpenAI Cookbook: https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb
export function estimateTokensFromMessages(messages: Message[]) {
    try {
        const tokensPerMessage = 3
        const tokensPerName = 1
        let ret = 0
        for (const msg of messages) {
            ret += tokensPerMessage
            ret += estimateTokens(msg.content)
            ret += estimateTokens(msg.role)
            if (msg.name) {
                ret += estimateTokens(msg.name)
                ret += tokensPerName
            }
        }
        ret += 3 // every reply is primed with <|start|>assistant<|message|>
        return ret
    } catch (e) {
        Sentry.captureException(e)
        return -1
    }
}
