import React, { useEffect } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { Box, Grid } from '@mui/material'
import { RemoteConfig, Session, ModelProvider } from '../shared/types'
import SettingDialog from './pages/SettingDialog'
import ChatConfigWindow from './pages/ChatConfigWindow'
import CleanWidnow from './pages/CleanWindow'
import AboutWindow from './pages/AboutWindow'
import useThemeSwicher from './hooks/useThemeSwitcher'
import useShortcut from './hooks/useShortcut'
import useScreenChange from './hooks/useScreenChange'
import * as remote from './packages/remote'
import CopilotWindow from './pages/CopilotWindow'
import { useI18nEffect } from './hooks/useI18nEffect'
import Toasts from './components/Toasts'
import * as settingActions from './stores/settingActions'
import { usePremium } from './hooks/usePremium'
import RemoteDialogWindow from './pages/RemoteDialogWindow'
import { useSystemLanguageWhenInit } from './hooks/useDefaultSystemLanguage'
import ClearConversationListWindow from './pages/ClearConversationListWindow'
import MainPane from './MainPane'
import { useAtom, useAtomValue } from 'jotai'
import * as atoms from './stores/atoms'
import SearchDialog from './pages/SearchDialog'
import Sidebar from './Sidebar'
import { CHATBOX_BUILD_TARGET } from '@/variables'
import PictureDialog from './pages/PictureDialog'
import MessageEditDialog from './pages/MessageEditDialog'
import ThreadHistoryDrawer from './components/ThreadHistoryDrawer'

function Main() {
    // 是否展示菜单栏
    const [showSidebar, setShowSidebar] = useAtom(atoms.showSidebarAtom)
    const spellCheck = useAtomValue(atoms.spellCheckAtom)

    // 是否展示设置窗口
    const [openSettingWindow, setOpenSettingWindow] = useAtom(atoms.openSettingDialogAtom)
    useEffect(() => {
        // 通过定时器延迟启动，防止处理状态底层存储的异步加载前错误的初始数据
        setTimeout(() => {
            ;(async () => {
                if (settingActions.needEditSetting()) {
                    // 除了在手机移动端，其他环境都优先使用ChatboxAI
                    if (CHATBOX_BUILD_TARGET !== 'mobile_app') {
                        const remoteConfig = await remote.getRemoteConfig('setting_chatboxai_first').catch(
                            () =>
                                ({
                                    setting_chatboxai_first: false,
                                } as RemoteConfig)
                        )
                        if (remoteConfig.setting_chatboxai_first) {
                            settingActions.modify({
                                aiProvider: ModelProvider.ChatboxAI,
                            })
                        }
                    }
                    setOpenSettingWindow('ai')
                }
            })()
        }, 2000)
    }, [])

    // 是否展示相关信息的窗口
    const [openAboutWindow, setOpenAboutWindow] = React.useState(false)

    // 是否展示copilot窗口
    const [openCopilotWindow, setOpenCopilotWindow] = React.useState(false)

    // 是否展示会话列表清理窗口
    const [openClearConversationListWindow, setOpenClearConversationListWindow] = React.useState(false)

    return (
        <Box className="box-border App" spellCheck={spellCheck}>
            <Grid container className="h-full">
                <Sidebar
                    open={showSidebar}
                    swtichOpen={setShowSidebar}
                    openClearConversationListWindow={() => setOpenClearConversationListWindow(true)}
                    openCopilotWindow={() => setOpenCopilotWindow(true)}
                    openAboutWindow={() => setOpenAboutWindow(true)}
                    setOpenSettingWindow={setOpenSettingWindow}
                />
                <MainPane />
                <ThreadHistoryDrawer />
            </Grid>
            <SettingDialog
                open={!!openSettingWindow}
                targetTab={openSettingWindow || undefined}
                close={() => setOpenSettingWindow(null)}
            />
            <AboutWindow open={openAboutWindow} close={() => setOpenAboutWindow(false)} />
            <ChatConfigWindow />
            <CleanWidnow />
            <CopilotWindow
                open={openCopilotWindow}
                // premiumActivated={store.premiumActivated}
                // openPremiumPage={() => {
                //     setOpenSettingWindow('premium')
                // }}
                close={() => setOpenCopilotWindow(false)}
            />
            <RemoteDialogWindow />
            <ClearConversationListWindow
                open={openClearConversationListWindow}
                close={() => setOpenClearConversationListWindow(false)}
            />
            <SearchDialog />
            <PictureDialog />
            <MessageEditDialog />
            <Toasts />
        </Box>
    )
}

export default function App() {
    useI18nEffect()
    usePremium() // 每次启动都执行usePremium，防止用户在其他地方取消订阅
    useSystemLanguageWhenInit()
    useShortcut()
    useScreenChange()
    const theme = useThemeSwicher()
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Main />
        </ThemeProvider>
    )
}
