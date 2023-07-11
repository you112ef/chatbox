import React, { useEffect, useRef } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import {
    Toolbar,
    Box,
    Badge,
    List,
    ListSubheader,
    ListItemText,
    MenuList,
    IconButton,
    ButtonGroup,
    Stack,
    Grid,
    MenuItem,
    ListItemIcon,
    Typography,
    Divider,
    useTheme,
    useMediaQuery,
    debounce,
} from '@mui/material'
import { RemoteConfig, Session, ModelProvider } from './types'
import SettingWindow from './SettingWindow'
import ChatConfigWindow from './ChatConfigWindow'
import SettingsIcon from '@mui/icons-material/Settings'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CleaningServicesIcon from '@mui/icons-material/CleaningServices'
import Save from '@mui/icons-material/Save'
import CleanWidnow from './CleanWindow'
import AboutWindow from './AboutWindow'
import useThemeSwicher from './hooks/useThemeSwitcher'
import { useTranslation } from 'react-i18next'
import icon from './icon.png'
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp'
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown'
import SponsorChip from './SponsorChip'
import './styles/App.css'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import * as api from './api'
import * as remote from './remote'
import CopilotWindow from './CopilotWindow'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import * as atoms from './stores/atoms'
import { useAtomValue } from 'jotai'
import MessageInput from './MessageInput'
import useAnalytics from './hooks/useAnalytics'
import { useI18nEffect } from './hooks/useI18nEffect'
import useVersion from './hooks/useVersion'
import Toasts from './Toasts'
import SessionList from './SessionList'
import MessageList from './MessageList'
import * as toastActions from './stores/toastActions'
import * as sessionActions from './stores/sessionActions'
import * as settingActions from './stores/settingActions'
import { usePremium } from './hooks/usePremium'
import RemoteDialogWindow from './RemoteDialogWindow'
import { useSystemLanguageWhenInit } from './hooks/useDefaultSystemLanguage'
import ClearConversationListWindow from './ClearConversationListWindow'

function Main() {
    const { t } = useTranslation()

    // states
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const settings = useAtomValue(atoms.settingsAtom)
    const configs = useAtomValue(atoms.configsAtom)

    // actions

    const versionHook = useVersion()
    const premium = usePremium() // 每次启动都执行usePremium，防止用户在其他地方取消订阅

    // 是否展示设置窗口
    const [openSettingWindow, setOpenSettingWindow] = React.useState<'ai' | 'display' | null>(null)
    useEffect(() => {
        // 通过定时器延迟启动，防止处理状态底层存储的异步加载前错误的初始数据
        setTimeout(() => {
            ; (async () => {
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

    // 是否展示菜单栏
    const theme = useTheme()
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
    const [showMenu, setShowMenu] = React.useState(!isSmallScreen)

    const messageListRef = useRef<HTMLDivElement>(null)
    const messageScrollRef = useRef<{ msgId: string; smooth?: boolean } | null>(null)
    useEffect(() => {
        if (!messageScrollRef.current) {
            return
        }
        if (!messageListRef.current) {
            return
        }
        const container = messageListRef.current
        const element = document.getElementById(messageScrollRef.current.msgId)
        if (!container || !element) {
            return
        }
        const elementRect = element.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        const isInsideLeft = elementRect.left >= containerRect.left
        const isInsideRight = elementRect.right <= containerRect.right
        const isInsideTop = elementRect.top >= containerRect.top
        const isInsideBottom = elementRect.bottom <= containerRect.bottom
        if (isInsideLeft && isInsideRight && isInsideTop && isInsideBottom) {
            return
        }
        // 平滑滚动
        element.scrollIntoView({
            behavior: messageScrollRef.current.smooth ? 'smooth' : 'auto',
            block: 'end',
            inline: 'nearest',
        })
    })
    // stop auto-scroll when user scroll
    useEffect(() => {
        if (!messageListRef.current) {
            return
        }
        messageListRef.current.addEventListener('wheel', function (e: any) {
            messageScrollRef.current = null
        })
    }, [])

    // 切换到当前会话，自动滚动到最后一条消息
    useEffect(() => {
        messageListToBottom()
    }, [currentSession.id])

    // show scroll to top or bottom button when user scroll
    const [atScrollTop, setAtScrollTop] = React.useState(false)
    const [atScrollBottom, setAtScrollBottom] = React.useState(false)
    const [needScroll, setNeedScroll] = React.useState(false)
    useEffect(() => {
        if (!messageListRef.current) {
            return
        }
        const handleScroll = () => {
            if (!messageListRef.current) {
                return
            }
            const { scrollTop, scrollHeight, clientHeight } = messageListRef.current
            if (scrollTop === 0) {
                setAtScrollTop(true)
                setAtScrollBottom(false)
            } else if (scrollTop + clientHeight === scrollHeight) {
                setAtScrollTop(false)
                setAtScrollBottom(true)
            } else {
                setAtScrollTop(false)
                setAtScrollBottom(false)
            }
            setNeedScroll(scrollHeight > clientHeight)
        }

        handleScroll()
        messageListRef.current.addEventListener('scroll', debounce(handleScroll, 100))
    }, [])
    const messageListToTop = () => {
        if (!messageListRef.current) {
            return
        }
        messageListRef.current.scrollTop = 0
    }
    const messageListToBottom = () => {
        if (!messageListRef.current) {
            return
        }
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight
    }

    // 会话名称自动生成
    useEffect(() => {
        if (
            currentSession.name === 'Untitled' &&
            currentSession.messages.findIndex((msg) => msg.role === 'assistant' && !msg.generating) !== -1
        ) {
            sessionActions.generateName(currentSession.id)
        }
    }, [currentSession.messages])

    const codeBlockCopyEvent = useRef((e: Event) => {
        const target: HTMLElement = e.target as HTMLElement

        const isCopyActionClassName = target.className === 'copy-action'
        const isCodeBlockParent = target.parentElement?.parentElement?.className === 'code-block-wrapper'

        // check is copy action button
        if (!(isCopyActionClassName && isCodeBlockParent)) {
            return
        }

        // got codes
        const content = target?.parentNode?.parentNode?.querySelector('code')?.innerText ?? ''

        // do copy
        // * thats lines copy from copy block content action
        navigator.clipboard.writeText(content)
        toastActions.add(t('copied to clipboard'))
    })

    // bind code block copy event on mounted
    useEffect(() => {
        document.addEventListener('click', codeBlockCopyEvent.current)

        return () => {
            document.removeEventListener('click', codeBlockCopyEvent.current)
        }
    }, [])

    const [configureChatConfig, setConfigureChatConfig] = React.useState<Session | null>(null)

    const [sessionClean, setSessionClean] = React.useState<Session | null>(null)

    const editCurrentSession = () => {
        setConfigureChatConfig(currentSession)
    }

    const exportSession = async (session: Session) => {
        const content = session.messages
            .map((msg) => `**${msg.role}**:\n${msg.content}`)
            .join('\n\n--------------------\n\n')
        return api.exportTextFile('Export.md', content)
    }

    const sessionListRef = useRef<HTMLDivElement>(null)
    const handleCreateNewSession = () => {
        sessionActions.createEmptyThenSwitch()
        if (sessionListRef.current) {
            sessionListRef.current.scrollTo(0, 0)
        }
    }

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    return (
        <Box className="App">
            {/* 应用标题栏 */}
            <div onDoubleClick={api.switchWindowMaximized} style={{
                height: '26px',
                padding: '0',
                margin: '0',
                '-webkit-app-region': 'drag', // 实现窗口拖动
                '-webkit-user-select': 'none',
            } as any}></div>

            <Grid container sx={{ height: 'calc(100% - 40px)' }} >
                {showMenu && (
                    <Grid
                        item
                        sx={{
                            height: '100%',
                            [theme.breakpoints.down('sm')]: {
                                position: 'absolute',
                                zIndex: 100,
                                left: '20px',
                                right: 0,
                                bottom: 0,
                                top: 0,
                            },
                        }}
                    >
                        <Stack
                            className="ToolBar"
                            sx={{
                                width: '210px',
                                height: '100%',
                                [theme.breakpoints.down('sm')]: {
                                    position: 'absolute',
                                    zIndex: 1,
                                },
                            }}
                        >
                            <Toolbar variant="dense" className='flex align-center py-4' >
                                <img src={icon} className='w-8 h-8 mr-2 align-middle inline-block' />
                                <span className='text-2xl align-middle inline-block'>Chatbox</span>
                            </Toolbar>

                            <MenuList
                                sx={{
                                    width: '100%',
                                    position: 'relative',
                                    overflow: 'auto',
                                    height: '60vh',
                                    '& ul': { padding: 0 },
                                }}
                                className="scroll"
                                subheader={
                                    <ListSubheader className='px-4 flex justify-between items-center'>
                                        <span className='text-xs opacity-80'>{t('chat')}</span>
                                        <IconButton onClick={() => setOpenClearConversationListWindow(true)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 opacity-80">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                            </svg>
                                        </IconButton>
                                    </ListSubheader>
                                }
                                component="div"
                                ref={sessionListRef}
                            >
                                <SessionList
                                    setConfigureChatConfig={setConfigureChatConfig}
                                    textareaRef={textareaRef}
                                />
                            </MenuList>

                            <Divider />

                            <MenuList>
                                <MenuItem onClick={handleCreateNewSession}>
                                    <ListItemIcon>
                                        <IconButton>
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                    </ListItemIcon>
                                    <ListItemText>{t('new chat')}</ListItemText>
                                    <Typography variant="body2" color="text.secondary">
                                        {/* ⌘N */}
                                    </Typography>
                                </MenuItem>

                                <MenuItem onClick={() => setOpenCopilotWindow(true)}>
                                    <ListItemIcon>
                                        <IconButton>
                                            <SmartToyIcon fontSize="small" />
                                        </IconButton>
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Typography>{t('My Copilots')}</Typography>
                                    </ListItemText>
                                </MenuItem>

                                <MenuItem
                                    onClick={() => {
                                        setOpenSettingWindow('ai')
                                    }}
                                >
                                    <ListItemIcon>
                                        <IconButton>
                                            <SettingsIcon fontSize="small" />
                                        </IconButton>
                                    </ListItemIcon>
                                    <ListItemText>{t('settings')}</ListItemText>
                                    <Typography variant="body2" color="text.secondary">
                                        {/* ⌘N */}
                                    </Typography>
                                </MenuItem>

                                <MenuItem onClick={() => setOpenAboutWindow(true)}>
                                    <ListItemIcon>
                                        <IconButton>
                                            <InfoOutlinedIcon fontSize="small" />
                                        </IconButton>
                                    </ListItemIcon>
                                    <ListItemText>
                                        <Badge
                                            color="primary"
                                            variant="dot"
                                            invisible={!versionHook.needCheckUpdate}
                                            sx={{ paddingRight: '8px' }}
                                        >
                                            <Typography sx={{ opacity: 0.5 }}>
                                                {t('About')} ({versionHook.version})
                                            </Typography>
                                        </Badge>
                                    </ListItemText>
                                </MenuItem>
                            </MenuList>
                        </Stack>
                        <Box
                            onClick={() => setShowMenu(false)}
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                [theme.breakpoints.up('sm')]: {
                                    display: 'none',
                                },
                            }}
                        ></Box>
                    </Grid>
                )}
                <Grid
                    item
                    xs
                    sx={{
                        width: '0px',
                        height: '100%',
                    }}
                >
                    <Stack
                        sx={{
                            height: '100%',
                            position: 'relative',
                        }}
                    >
                        <Toolbar style={{ padding: '0 10px' }}>
                            <IconButton onClick={() => setShowMenu(!showMenu)}>
                                {!showMenu ? (
                                    <img
                                        src={icon}
                                        style={{
                                            width: '30px',
                                            height: '30px',
                                        }}
                                    />
                                ) : (
                                    <MenuOpenIcon style={{ fontSize: '26px' }} />
                                )}
                            </IconButton>
                            <Typography
                                variant="h6"
                                color="inherit"
                                component="div"
                                noWrap
                                sx={{
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                <span
                                    onClick={() => {
                                        editCurrentSession()
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {currentSession.name}
                                </span>
                            </Typography>
                            <SponsorChip sessionId={currentSession.id} />
                            <IconButton
                                edge="start"
                                color="inherit"
                                aria-label="menu"
                                sx={{ mr: 2 }}
                                onClick={() => setSessionClean(currentSession)}
                            >
                                <CleaningServicesIcon />
                            </IconButton>
                            <IconButton
                                edge="start"
                                color="inherit"
                                aria-label="menu"
                                sx={{}}
                                onClick={() => exportSession(currentSession)}
                            >
                                <Save />
                            </IconButton>
                        </Toolbar>
                        <List
                            className="scroll"
                            sx={{
                                bgcolor: 'background.paper',
                                overflow: 'auto',
                                '& ul': { padding: 0 },
                                height: '100%',
                            }}
                            component="div"
                            ref={messageListRef}
                        >
                            <MessageList messageScrollRef={messageScrollRef} />
                        </List>
                        <Box sx={{ padding: '20px 0', position: 'relative' }}>
                            {needScroll && (
                                <ButtonGroup
                                    sx={{
                                        position: 'absolute',
                                        right: '0.2rem',
                                        top: '-5.5rem',
                                        opacity: 0.6,
                                    }}
                                    orientation="vertical"
                                >
                                    <IconButton
                                        onClick={() => messageListToTop()}
                                        sx={{
                                            visibility: atScrollTop ? 'hidden' : 'visible',
                                        }}
                                    >
                                        <ArrowCircleUpIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => messageListToBottom()}
                                        sx={{
                                            visibility: atScrollBottom ? 'hidden' : 'visible',
                                        }}
                                    >
                                        <ArrowCircleDownIcon />
                                    </IconButton>
                                </ButtonGroup>
                            )}
                            <MessageInput
                                currentSessionId={currentSession.id}
                                messageScrollRef={messageScrollRef}
                                textareaRef={textareaRef}
                            />
                        </Box>
                    </Stack>
                </Grid>

                <SettingWindow
                    open={!!openSettingWindow}
                    targetTab={openSettingWindow || undefined}
                    close={() => setOpenSettingWindow(null)}
                />
                <AboutWindow
                    open={openAboutWindow}
                    version={versionHook.version}
                    lang={settings.language}
                    close={() => setOpenAboutWindow(false)}
                />
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
                <ClearConversationListWindow open={openClearConversationListWindow} close={() => setOpenClearConversationListWindow(false)}/>
                <Toasts />
            </Grid>
        </Box>
    )
}

export default function App() {
    useI18nEffect()
    useAnalytics()
    useSystemLanguageWhenInit()
    const theme = useThemeSwicher()
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Main />
        </ThemeProvider>
    )
}
