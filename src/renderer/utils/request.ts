import platform from '@/platform'
import { ApiError, BaseError, NetworkError } from '../packages/models/errors'

function isLocalHost(url: string): boolean {
  const prefixes = [
    'http://localhost:',
    'https://localhost:',
    'http://127.',
    'https://127.',
    'http://[::1]:',
    'https://[::1]:',

    'http://192.168.',
    'https://192.168.',
    'http://10.',
    'https://10.',
    'http://172.',
    'https://172.',
  ]
  return prefixes.some((prefix) => url.startsWith(prefix))
}

export const apiRequest = {
  post: async (
    url: string,
    headers: Record<string, string>,
    body: Record<string, any>,
    options?: {
      signal?: AbortSignal
      retry?: number
      useProxy?: boolean
    }
  ) => {
    const { signal, retry = 3, useProxy = false } = options || {}

    if (useProxy && !isLocalHost(url)) {
      headers['CHATBOX-TARGET-URI'] = url
      headers['CHATBOX-PLATFORM'] = platform.type
      headers['CHATBOX-VERSION'] = (await platform.getVersion()) || 'unknown'
      url = 'https://proxy.ai-chatbox.com/proxy-api/completions'
    }

    let requestError: ApiError | NetworkError | null = null
    for (let i = 0; i < retry + 1; i++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal,
        })
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
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
    if (requestError) {
      throw requestError
    } else {
      throw new Error('Unknown error')
    }
  },

  get: async (
    url: string,
    headers: Record<string, string>,
    options?: {
      signal?: AbortSignal
      retry?: number
      useProxy?: boolean
    }
  ) => {
    const { signal, retry = 3, useProxy = false } = options || {}

    if (useProxy && !isLocalHost(url)) {
      headers['CHATBOX-TARGET-URI'] = url
      headers['CHATBOX-PLATFORM'] = platform.type
      headers['CHATBOX-VERSION'] = (await platform.getVersion()) || 'unknown'
      url = 'https://proxy.ai-chatbox.com/proxy-api/completions'
    }

    let requestError: ApiError | NetworkError | null = null
    for (let i = 0; i < retry + 1; i++) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers,
          signal,
        })
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
  },
}
