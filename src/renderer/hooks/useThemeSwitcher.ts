import { useMemo, useLayoutEffect } from 'react'
import { getDefaultStore, useAtomValue } from 'jotai'
import { realThemeAtom, themeAtom, fontSizeAtom } from '../stores/atoms'
import { createTheme } from '@mui/material/styles'
import { ThemeOptions } from '@mui/material/styles'
import { ThemeMode } from '../../shared/types'
import * as api from '../packages/runtime'

export const switchTheme = async (theme: ThemeMode) => {
    const store = getDefaultStore()
    if (theme === ThemeMode.System) {
        const isDark = await api.shouldUseDarkColors()
        store.set(realThemeAtom, isDark ? 'dark' : 'light')
    } else {
        store.set(realThemeAtom, theme === ThemeMode.Dark ? 'dark' : 'light')
    }
}

export default function useThemeSwicher() {
    const theme = useAtomValue(themeAtom)
    const fontSize = useAtomValue(fontSizeAtom)
    const realTheme = useAtomValue(realThemeAtom)

    useLayoutEffect(() => {
        switchTheme(theme)
    }, [theme])

    useLayoutEffect(() => {
        api.onSystemThemeChange(() => {
            const store = getDefaultStore()
            const theme = store.get(themeAtom)
            switchTheme(theme)
        })
    }, [])

    useLayoutEffect(() => {
        // update material-ui theme
        document.querySelector('html')?.setAttribute('data-theme', realTheme)
        // update tailwindcss theme
        if (realTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [realTheme])

    const themeObj = useMemo(() => createTheme(fetchThemeDesign(realTheme, fontSize)), [realTheme, fontSize])
    return themeObj
}

export function fetchThemeDesign(realTheme: 'light' | 'dark', fontSize: number): ThemeOptions {
    return {
        palette: {
            mode: realTheme,
            ...(realTheme === 'light'
                ? {}
                : {
                    background: {
                        default: 'rgb(40, 40, 40)',
                        paper: 'rgb(40, 40, 40)',
                    },
                }),
        },
        typography: {
            // In Chinese and Japanese the characters are usually larger,
            // so a smaller fontsize may be appropriate.
            fontSize,
        },
    }
}
