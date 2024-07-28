import { getDefaultStore } from 'jotai'
import { useEffect } from 'react'
import { settingsAtom } from '../stores/atoms'
import platform from '../platform'

export function useSystemLanguageWhenInit() {
    useEffect(() => {
        // 通过定时器延迟启动，防止处理状态底层存储的异步加载前错误的初始数据
        setTimeout(() => {
            ; (async () => {
                const store = getDefaultStore()
                const settings = store.get(settingsAtom)
                if (!settings.languageInited) {
                    let locale = await platform.getLocale()
                    settings.language = locale
                }
                settings.languageInited = true
                store.set(settingsAtom, { ...settings })
            })()
        }, 2000)
    }, [])
}
