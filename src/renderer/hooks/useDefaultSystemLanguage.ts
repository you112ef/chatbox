import { getDefaultStore } from 'jotai'
import { useEffect } from 'react'
import { settingsAtom } from '../stores/atoms'
import * as api from '../packages/runtime'
import { Language } from '../../shared/types'

export function useSystemLanguageWhenInit() {
    useEffect(() => {
        // 通过定时器延迟启动，防止处理状态底层存储的异步加载前错误的初始数据
        setTimeout(() => {
            ;(async () => {
                const store = getDefaultStore()
                const settings = store.get(settingsAtom)
                if (!settings.languageInited) {
                    const locale = await api.getLocale()
                    settings.language = parseLocale(locale)
                }
                settings.languageInited = true
                store.set(settingsAtom, { ...settings })
            })()
        }, 600)
    }, [])
}

// 将 electron getLocale、浏览器的 navigator.language 返回的语言信息，转换为应用的 locale
function parseLocale(locale: string): Language {
    if (
        locale === 'zh' ||
        locale.startsWith('zh_CN') ||
        locale.startsWith('zh-CN') ||
        locale.startsWith('zh_Hans') ||
        locale.startsWith('zh-Hans')
    ) {
        return 'zh-Hans'
    }
    if (
        locale.startsWith('zh_HK') ||
        locale.startsWith('zh-HK') ||
        locale.startsWith('zh_TW') ||
        locale.startsWith('zh-TW') ||
        locale.startsWith('zh_Hant') ||
        locale.startsWith('zh-Hant')
    ) {
        return 'zh-Hant'
    }
    if (locale.startsWith('ja')) {
        return 'ja'
    }
    return 'en'
}
