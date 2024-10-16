import { useEffect } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { Box, Grid } from '@mui/material'
import { RemoteConfig, ModelProvider } from '../shared/types'
import SettingDialog from './pages/SettingDialog'
import ChatConfigWindow from './pages/ChatConfigWindow'
import CleanWidnow from './pages/CleanWindow'
import AboutWindow from './pages/AboutWindow'
import useAppTheme from './hooks/useAppTheme'
import useShortcut from './hooks/useShortcut'
import useScreenChange from './hooks/useScreenChange'
import * as remote from './packages/remote'
import CopilotWindow from './pages/CopilotWindow'
import { useI18nEffect } from './hooks/useI18nEffect'
import Toasts from './components/Toasts'
import * as settingActions from './stores/settingActions'
import RemoteDialogWindow from './pages/RemoteDialogWindow'
import { useSystemLanguageWhenInit } from './hooks/useDefaultSystemLanguage'
import ClearConversationListWindow from './pages/ClearConversationListWindow'
import MainPane from './MainPane'
import { useAtomValue, useSetAtom } from 'jotai'
import * as atoms from './stores/atoms'
import SearchDialog from './pages/SearchDialog'
import Sidebar from './Sidebar'
import PictureDialog from './pages/PictureDialog'
import MessageEditDialog from './pages/MessageEditDialog'
import ThreadHistoryDrawer from './components/ThreadHistoryDrawer'
import WelcomeDialog from './pages/WelcomeDialog'
import * as premiumActions from './stores/premiumActions'
import platform from './platform'
import ExportChatDialog from '@/pages/ExportChatDialog'
import ArtifactDialog from '@/pages/ArtifactDialog'
import MermaidDialog from './pages/MermaidDialog'

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
            <Grid container className="h-full">
                <Sidebar />
                <MainPane />
                <ThreadHistoryDrawer />
            </Grid>
            <SettingDialog />
            <AboutWindow />
            <ChatConfigWindow />
            <CleanWidnow />
            <CopilotWindow />
            <RemoteDialogWindow />
            <ClearConversationListWindow />
            <SearchDialog />
            <ExportChatDialog />
            <PictureDialog />
            <MessageEditDialog />
            <WelcomeDialog />
            <ArtifactDialog />
            <MermaidDialog />
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
