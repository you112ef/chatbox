import { useEffect } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { Box } from '@mui/material'
import { RemoteConfig, ModelProvider } from '../shared/types'
import useAppTheme from './hooks/useAppTheme'
import useShortcut from './hooks/useShortcut'
import useScreenChange from './hooks/useScreenChange'
import * as remote from './packages/remote'
import { useI18nEffect } from './hooks/useI18nEffect'
import Toasts from './components/Toasts'
import * as settingActions from './stores/settingActions'
import { useSystemLanguageWhenInit } from './hooks/useDefaultSystemLanguage'
import MainPane from './MainPane'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import * as atoms from './stores/atoms'
import { Sidebar, SidebarDrawer } from './Sidebar'
import ThreadHistoryDrawer from './components/ThreadHistoryDrawer'
import Dialogs from './pages/Dialogs'
import * as premiumActions from './stores/premiumActions'
import platform from './platform'
import { Allotment } from 'allotment'
import 'allotment/dist/style.css'
import { useIsSmallScreen } from './hooks/useScreenChange'
import PaneSizesRecorder from './packages/pane_sizes_recorder'

function MobileLayout() {
    return (
        <>
            <SidebarDrawer />
            <MainPane />
        </>
    )
}

function DesktopLayout() {
    const language = useAtomValue(atoms.languageAtom)
    const [showSidebar, setShowSidebar] = useAtom(atoms.showSidebarAtom)
    const paneSizesRecorder = new PaneSizesRecorder(`desktop-main-layout${language === 'ar' ? '-ar' : ''}`)
    let defaultSizes = showSidebar ? paneSizesRecorder.get() : undefined
    if (defaultSizes && defaultSizes.some((size) => size === 0)) {
        defaultSizes = undefined
    }
    return language !== 'ar' ? (
        // 这里的 key 很关键，解决了语言切换后的宽度关联问题
        <Allotment
            key="allotment-split-pane"
            defaultSizes={defaultSizes}
            proportionalLayout={false}
            onChange={(sizes) => {
                paneSizesRecorder.set(sizes)
            }}
            onVisibleChange={(index, visible) => {
                if (index === 0) {
                    setShowSidebar(visible)
                }
            }}
        >
            <Allotment.Pane visible={showSidebar} preferredSize={240} minSize={80} snap>
                <Sidebar />
            </Allotment.Pane>
            <Allotment.Pane minSize={300}>
                <MainPane />
            </Allotment.Pane>
        </Allotment>
    ) : (
        <Allotment
            key="allotment-split-pane-ar"
            defaultSizes={defaultSizes}
            onChange={(sizes) => {
                paneSizesRecorder.set(sizes)
            }}
            onVisibleChange={(index, visible) => {
                if (index === 1) {
                    setShowSidebar(visible)
                }
            }}
        >
            <Allotment.Pane minSize={300}>
                <MainPane />
            </Allotment.Pane>
            <Allotment.Pane visible={showSidebar} preferredSize={240} minSize={80} snap>
                <Sidebar />
            </Allotment.Pane>
        </Allotment>
    )
}

function Layout() {
    const isSmallScreen = useIsSmallScreen()
    return isSmallScreen ? <MobileLayout /> : <DesktopLayout />
}

function Main() {
    const spellCheck = useAtomValue(atoms.spellCheckAtom)
    const language = useAtomValue(atoms.languageAtom)

    const setOpenWelcomeDialog = useSetAtom(atoms.openWelcomeDialogAtom)
    const setOpenAboutDialog = useSetAtom(atoms.openAboutDialogAtom)
    const setRemoteConfig = useSetAtom(atoms.remoteConfigAtom)

    useEffect(() => {
        // 通过定时器延迟启动，防止处理状态底层存储的异步加载前错误的初始数据
        setTimeout(() => {
            ;(async () => {
                const remoteConfig = await remote
                    .getRemoteConfig('setting_chatboxai_first')
                    .catch(() => ({ setting_chatboxai_first: false } as RemoteConfig))
                setRemoteConfig((conf) => ({ ...conf, ...remoteConfig }))
                // 是否需要弹出设置窗口
                if (settingActions.needEditSetting()) {
                    if (remoteConfig.setting_chatboxai_first) {
                        settingActions.modify({ aiProvider: ModelProvider.ChatboxAI })
                    }
                    setOpenWelcomeDialog(true)
                    return
                }
                // 是否需要弹出关于窗口（更新后首次启动）
                // 目前仅在桌面版本更新后首次启动、且网络环境为“外网”的情况下才自动弹窗
                const shouldShowAboutDialogWhenStartUp = await platform.shouldShowAboutDialogWhenStartUp()
                if (shouldShowAboutDialogWhenStartUp && remoteConfig.setting_chatboxai_first) {
                    setOpenAboutDialog(true)
                    return
                }
            })()
        }, 2000)
    }, [])

    return (
        <Box className="box-border App" spellCheck={spellCheck} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <Layout />
            <ThreadHistoryDrawer />
            <Dialogs />
            <Toasts />
        </Box>
    )
}

export default function App() {
    useI18nEffect()
    premiumActions.useAutoValidate() // 每次启动都执行 license 检查，防止用户在lemonsqueezy管理页面中取消了当前设备的激活
    useSystemLanguageWhenInit()
    useShortcut()
    useScreenChange()
    const theme = useAppTheme()
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Main />
        </ThemeProvider>
    )
}
