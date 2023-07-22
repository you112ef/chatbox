import React, { useEffect } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { Box, Grid, useTheme, useMediaQuery } from '@mui/material'
import { RemoteConfig, Session, ModelProvider } from './types'
import SettingWindow from './SettingWindow'
import ChatConfigWindow from './ChatConfigWindow'
import CleanWidnow from './CleanWindow'
import AboutWindow from './AboutWindow'
import useThemeSwicher from './hooks/useThemeSwitcher'
import './styles/App.css'
import * as remote from './remote'
import CopilotWindow from './CopilotWindow'
import useAnalytics from './hooks/useAnalytics'
import { useI18nEffect } from './hooks/useI18nEffect'
import Toasts from './Toasts'
import * as settingActions from './stores/settingActions'
import { usePremium } from './hooks/usePremium'
import RemoteDialogWindow from './RemoteDialogWindow'
import { useSystemLanguageWhenInit } from './hooks/useDefaultSystemLanguage'
import ClearConversationListWindow from './ClearConversationListWindow'
import Sidebar from './Sidebar'
import MainPane from './MainPane'

function Main() {
    // 是否展示菜单栏
    const theme = useTheme()
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
    const [showMenu, setShowMenu] = React.useState(!isSmallScreen)

    // 是否展示设置窗口
    const [openSettingWindow, setOpenSettingWindow] = React.useState<'ai' | 'display' | null>(null)
    useEffect(() => {
        // 通过定时器延迟启动，防止处理状态底层存储的异步加载前错误的初始数据
        setTimeout(() => {
            ;(async () => {
                if (settingActions.needEditSetting()) {
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
                    setOpenSettingWindow('ai')
                }
            })()
        }, 600)
    }, [])

    // 是否展示相关信息的窗口
    const [openAboutWindow, setOpenAboutWindow] = React.useState(false)

    // 是否展示copilot窗口
    const [openCopilotWindow, setOpenCopilotWindow] = React.useState(false)

    // 是否展示会话列表清理窗口
    const [openClearConversationListWindow, setOpenClearConversationListWindow] = React.useState(false)

    const [configureChatConfig, setConfigureChatConfig] = React.useState<Session | null>(null)

    const [sessionClean, setSessionClean] = React.useState<Session | null>(null)

    return (
        <Box className="App">
            <Grid container sx={{ height: '100%', paddingTop: '18px' }}>
                {showMenu && (
                    <Sidebar
                        setConfigureChatConfig={setConfigureChatConfig}
                        openClearConversationListWindow={() => setOpenClearConversationListWindow(true)}
                        openCopilotWindow={() => setOpenCopilotWindow(true)}
                        openAboutWindow={() => setOpenAboutWindow(true)}
                        setShowMenu={setShowMenu}
                        setOpenSettingWindow={setOpenSettingWindow}
                    />
                )}
                <MainPane
                    showMenu={showMenu}
                    setShowMenu={setShowMenu}
                    setConfigureChatConfig={setConfigureChatConfig}
                    setSessionClean={setSessionClean}
                />

                <SettingWindow
                    open={!!openSettingWindow}
                    targetTab={openSettingWindow || undefined}
                    close={() => setOpenSettingWindow(null)}
                />
                <AboutWindow open={openAboutWindow} close={() => setOpenAboutWindow(false)} />
                {configureChatConfig !== null && (
                    <ChatConfigWindow
                        open={configureChatConfig !== null}
                        session={configureChatConfig}
                        close={() => setConfigureChatConfig(null)}
                    />
                )}
                {sessionClean !== null && (
                    <CleanWidnow open={sessionClean !== null} close={() => setSessionClean(null)} />
                )}
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
                <Toasts />
            </Grid>
        </Box>
    )
}

export default function App() {
    useI18nEffect()
    useAnalytics()
    usePremium() // 每次启动都执行usePremium，防止用户在其他地方取消订阅
    useSystemLanguageWhenInit()
    const theme = useThemeSwicher()
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Main />
        </ThemeProvider>
    )
}
