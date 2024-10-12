import { Message } from '../../shared/types'

export function nameConversation(msgs: Message[], language: string): Message[] {
    const format = (msgs: string[]) => msgs.map((msg) => msg).join('\n\n---------\n\n')
    return [
        {
            id: '1',
            role: 'user',
            content: `Name the conversation based on the chat records.
Please provide a concise name, within 10 characters and without quotation marks.
Please use the ${language} language.
You only need to answer with the name.
The following is the conversation:

\`\`\`
${
    format(msgs.slice(0, 5).map((msg) => msg.content.slice(0, 100)))    // 限制长度以节省 tokens
}
\`\`\`

Please provide a concise name, within 10 characters and without quotation marks.
Please use the ${language} language.
You only need to answer with the name.
The conversation is named:`,
        },
    ]
}
