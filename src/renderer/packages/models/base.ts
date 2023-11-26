import { ApiError, NetworkError, AIProviderNoImplementedPaint, QuotaExhausted, BaseError } from './errors'
import IModel from './interfaces'

export default class Base implements IModel {
    public name = 'Unknown'

    constructor() {}

    async paint(prompt: string, num: number, signal?: AbortSignal): Promise<string[]> {
        throw new AIProviderNoImplementedPaint(this.name)
    }

    async post(
        url: string,
        headers: Record<string, string>,
        body: Record<string, any>,
        signal?: AbortSignal,
        retry = 3
    ) {
        let requestError: ApiError | NetworkError | null = null
        for (let i = 0; i < retry + 1; i++) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal,
                })
                // 配额用完了
                if (res.status === 499) {
                    const json = await res.json()
                    if (json?.error?.code === 'token_quota_exhausted') {
                        throw new QuotaExhausted()
                    }
                }
                // 状态码不在 200～299 之间，一般是接口报错了，这里也需要抛错后重试
                if (!res.ok) {
                    const err = await res.text().catch((e) => null)
                    throw new ApiError(`Status Code ${res.status}, ${err}`)
                }
                return res
            } catch (e) {
                if (e instanceof BaseError) {
                    requestError = e
                } else {
                    const err = e as Error
                    const origin = new URL(url).origin
                    requestError = new NetworkError(err.message, origin)
                }
            }
        }
        if (requestError) {
            throw requestError
        } else {
            throw new Error('Unknown error')
        }
    }
}
