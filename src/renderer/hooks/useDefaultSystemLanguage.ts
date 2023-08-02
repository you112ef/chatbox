import { getDefaultStore } from 'jotai'
import { useEffect } from 'react'
import { settingsAtom } from '../stores/atoms'
import * as api from '../packages/runtime'

export function useSystemLanguageWhenInit() {
    useEffect(() => {
        // 通过定时器延迟启动，防止处理状态底层存储的异步加载前错误的初始数据
        setTimeout(() => {
            ;(async () => {
                const store = getDefaultStore()
                const settings = store.get(settingsAtom)
                if (!settings.languageInited) {
                    const locale = await api.getLocale()
                    switch (locale) {
                        case 'zh':
                        case 'zh_CN':
                        case 'zh-CN':
                            settings.language = 'zh-Hans'
                            break
                        case 'zh_TW':
                        case 'zh-TW':
                            settings.language = 'zh-Hant'
                            break
                        default:
                            settings.language = 'en'
                            break
                    }
                }
                settings.languageInited = true
                store.set(settingsAtom, { ...settings })
            })()
        }, 600)
    }, [])
}
