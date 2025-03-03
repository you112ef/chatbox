import { Message } from 'src/shared/types'
import Base, { onResultChange } from './base'
import { ApiError } from './errors'

interface Options {
    chatglm6bUrl: string
}

export default class ChatGLM extends Base {
    public name = 'ChatGLM'

    public options: Options
    constructor(options: Options) {
        super()
        this.options = options
    }

    async callChatCompletion(
        messages: Message[],
        signal?: AbortSignal,
        onResultChange?: onResultChange
    ): Promise<string> {
        let prompt = ''
        const history: [string, string][] = []
        let userTmp = ''
        let assistantTmp = ''
        for (const msg of messages) {
            switch (msg.role) {
                case 'system':
                    history.push([msg.content, '好的，我照做，一切都听你的'])
                    prompt = msg.content
                    break
                case 'user':
                    if (assistantTmp) {
                        history.push([userTmp, assistantTmp])
                        userTmp = ''
                        assistantTmp = ''
                    }
                    if (userTmp) {
                        userTmp += '\n' + msg.content
                    } else {
                        userTmp = msg.content
                    }
                    prompt = msg.content
                    break
                case 'assistant':
                    if (assistantTmp) {
                        assistantTmp += '\n' + msg.content
                    } else {
                        assistantTmp = msg.content
                    }
                    break
            }
        }
        if (assistantTmp) {
            history.push([userTmp, assistantTmp])
        }
        const res = await this.post(
            this.options.chatglm6bUrl,
            {
                'Content-Type': 'application/json',
            },
            {
                prompt,
                history,
                // temperature,
            },
            { signal }
        )
        const json = await res.json()
        if (json.status !== 200) {
            throw new ApiError(JSON.stringify(json))
        }
        const str: string = typeof json.response === 'string' ? json.response : JSON.stringify(json.response)
        if (onResultChange) {
            onResultChange({ content: str })
        }
        return str
    }

    isSupportToolUse(): boolean {
        return false
    }
}
