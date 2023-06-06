import React, { useEffect, useRef } from 'react';
import * as client from './client'
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import {
    Toolbar, Box, Badge, Snackbar,
    List, ListSubheader, ListItemText, MenuList,
    IconButton, Button, ButtonGroup, Stack, Grid, MenuItem, ListItemIcon, Typography, Divider,
    TextField, useTheme, useMediaQuery, debounce,
} from '@mui/material';
import { Session } from './types'
import SettingWindow from './SettingWindow'
import ChatConfigWindow from './ChatConfigWindow'
import SettingsIcon from '@mui/icons-material/Settings';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import * as prompts from './prompts';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import Save from '@mui/icons-material/Save'
import CleanWidnow from './CleanWindow';
import AboutWindow from './AboutWindow';
import useThemeSwicher from './hooks/useThemeSwitcher';
import { useTranslation } from "react-i18next";
import icon from './icon.png'
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import SponsorChip from './SponsorChip'
import "./styles/App.scss"
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import * as api from './api'
import CopilotWindow from './CopilotWindow';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AddIcon from '@mui/icons-material/AddCircleOutline';
import * as atoms from './stores/atoms'
import { useAtomValue } from 'jotai'
import MessageInput from './MessageInput';
import useAnalytics from './hooks/useAnalytics';
import { useI18nEffect } from './hooks/useI18nEffect';
import useVersion from './hooks/useVersion';
import Toasts from './Toasts';
import SessionList from './SessionList';
import MessageList from './MessageList';
import * as toastActions from './stores/toastActions';
import * as sessionActions from './stores/sessionActions';
import * as settingActions from './stores/settingActions'

function Main() {
    const { t } = useTranslation()

    // states
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const settings = useAtomValue(atoms.settingsAtom)

    // actions

    const versionHook = useVersion()

    // 是否展示设置窗口
    const [openSettingWindow, setOpenSettingWindow] = React.useState<'ai' | 'display' | null>(null);
    useEffect(() => {
        setTimeout(() => {
            if (settingActions.needEditSetting()) {
                setOpenSettingWindow('ai')
            }
        }, 1500)
    }, [])

    // 是否展示相关信息的窗口
    const [openAboutWindow, setOpenAboutWindow] = React.useState(false);

    // 是否展示copilot窗口
    const [openCopilotWindow, setOpenCopilotWindow] = React.useState(false);

    // 是否展示菜单栏
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [showMenu, setShowMenu] = React.useState(!isSmallScreen);

    const messageListRef = useRef<HTMLDivElement>(null)
    const messageScrollRef = useRef<{ msgId: string, smooth?: boolean } | null>(null)
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
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const isInsideLeft = elementRect.left >= containerRect.left;
        const isInsideRight = elementRect.right <= containerRect.right;
        const isInsideTop = elementRect.top >= containerRect.top;
        const isInsideBottom = elementRect.bottom <= containerRect.bottom;
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
        });
    }, [])

    // 切换到当前会话，自动滚动到最后一条消息
    useEffect(() => {
        messageListToBottom();
    }, [currentSession.id])

    // show scroll to top or bottom button when user scroll
    const [atScrollTop, setAtScrollTop] = React.useState(false);
    const [atScrollBottom, setAtScrollBottom] = React.useState(false);
    const [needScroll, setNeedScroll] = React.useState(false);
    useEffect(() => {
        if (!messageListRef.current) {
            return
        }
        const handleScroll = () => {
            if (!messageListRef.current) {
                return
            }
            const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
            if (scrollTop === 0) {
                setAtScrollTop(true);
                setAtScrollBottom(false);
            } else if (scrollTop + clientHeight === scrollHeight) {
                setAtScrollTop(false);
                setAtScrollBottom(true);
            } else {
                setAtScrollTop(false);
                setAtScrollBottom(false);
            }
            setNeedScroll(scrollHeight > clientHeight);
        };

        handleScroll();
        messageListRef.current.addEventListener("scroll", debounce(handleScroll, 100));
    }, []);
    const messageListToTop = () => {
        if (!messageListRef.current) {
            return
        }
        messageListRef.current.scrollTop = 0;
    };
    const messageListToBottom = () => {
        if (!messageListRef.current) {
            return
        }
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    };

    // 会话名称自动生成
    useEffect(() => {
        if (
            currentSession.name === 'Untitled'
            && currentSession.messages.findIndex(msg => msg.role === 'assistant') !== -1
        ) {
            generateName(currentSession)
        }
    }, [currentSession.messages])

    const codeBlockCopyEvent = useRef((e: Event) => {
        const target: HTMLElement = e.target as HTMLElement;

        const isCopyActionClassName = target.className === 'copy-action';
        const isCodeBlockParent = target.parentElement?.parentElement?.className === 'code-block-wrapper';

        // check is copy action button
        if (!(isCopyActionClassName && isCodeBlockParent)) {
            return;
        }

        // got codes
        const content = target?.parentNode?.parentNode?.querySelector('code')?.innerText ?? '';

        // do copy
        // * thats lines copy from copy block content action
        navigator.clipboard.writeText(content);
        toastActions.add(t('copied to clipboard'));
    });

    // bind code block copy event on mounted
    useEffect(() => {
        document.addEventListener('click', codeBlockCopyEvent.current);

        return () => {
            document.removeEventListener('click', codeBlockCopyEvent.current);
        };
    }, []);

    const [configureChatConfig, setConfigureChatConfig] = React.useState<Session | null>(null);

    const [sessionClean, setSessionClean] = React.useState<Session | null>(null);

    const editCurrentSession = () => {
        setConfigureChatConfig(currentSession)
    };
    const generateName = async (session: Session) => {
        client.replay(
            settings,
            prompts.nameConversation(session.messages.slice(0, 3)),
            ({ text: name }) => {
                name = name.replace(/['"“”]/g, '')
                session.name = name
                sessionActions.modify(session)
            },
            (err) => {
                console.log(err)
            }
        )
    }
    const saveSession = async (session: Session) => {
        const content = session.messages
            .map(msg => `**${msg.role}**:\n${msg.content}`)
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

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    return (
        <Box className='App'>
            <Grid container sx={{
                height: '100%',
            }}>
                {showMenu && (
                    <Grid item
                        sx={{
                            height: '100%',
                            [theme.breakpoints.down("sm")]: {
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
                            className='ToolBar'
                            sx={{
                                width: '210px',
                                height: '100%',
                                [theme.breakpoints.down("sm")]: {
                                    position: 'absolute',
                                    zIndex: 1,
                                },
                            }}
                            spacing={2}
                        >
                            <Toolbar variant="dense" sx={{
                                display: "flex",
                                alignItems: "flex-end",
                            }} >
                                <img src={icon} style={{
                                    width: '35px',
                                    height: '35px',
                                    marginRight: '5px',
                                }} />
                                <Typography variant="h5" color="inherit" component="div" style={{ fontSize: '26px' }}>
                                    Chatbox
                                </Typography>
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
                                    <ListSubheader component="div">
                                        {t('chat')}
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
                                <MenuItem onClick={handleCreateNewSession} >
                                    <ListItemIcon>
                                        <IconButton><AddIcon fontSize="small" /></IconButton>
                                    </ListItemIcon>
                                    <ListItemText>
                                        {t('new chat')}
                                    </ListItemText>
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


                                <MenuItem onClick={() => {
                                    setOpenSettingWindow('ai')
                                }}
                                >
                                    <ListItemIcon>
                                        <IconButton><SettingsIcon fontSize="small" /></IconButton>
                                    </ListItemIcon>
                                    <ListItemText>
                                        {t('settings')}
                                    </ListItemText>
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
                                        <Badge color="primary" variant="dot" invisible={!versionHook.needCheckUpdate}
                                            sx={{ paddingRight: '8px' }} >
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
                                [theme.breakpoints.up("sm")]: {
                                    display: 'none',
                                },
                            }}
                        ></Box>
                    </Grid>)}
                <Grid item xs
                    sx={{
                        width: '0px',
                        height: '100%',
                    }}
                >
                    <Stack sx={{
                        height: '100%',
                        position: 'relative',
                    }} >
                        <Toolbar style={{ padding: '0 10px' }}>
                            <IconButton onClick={() => setShowMenu(!showMenu)} >
                                {
                                    !showMenu ? (
                                        <img src={icon} style={{
                                            width: '30px',
                                            height: '30px',
                                        }} />
                                    ) : (
                                        <MenuOpenIcon style={{ fontSize: '26px' }} />
                                    )
                                }
                            </IconButton>
                            <Typography variant="h6" color="inherit" component="div" noWrap
                                sx={{
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                <span onClick={() => { editCurrentSession() }} style={{ cursor: 'pointer' }}>
                                    {currentSession.name}
                                </span>
                            </Typography>
                            <SponsorChip sessionId={currentSession.id} />
                            <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}
                                onClick={() => setSessionClean(currentSession)}
                            >
                                <CleaningServicesIcon />
                            </IconButton>
                            <IconButton edge="start" color="inherit" aria-label="menu" sx={{}}
                                onClick={() => saveSession(currentSession)}
                            >
                                <Save />
                            </IconButton>
                        </Toolbar>
                        <List
                            className='scroll'
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
                        <Box sx={{ padding: '20px 0', position: 'relative', }}>
                            {(needScroll && <ButtonGroup
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
                                    sx={{ visibility: atScrollTop ? "hidden" : "visible", }}>
                                    <ArrowCircleUpIcon />
                                </IconButton>
                                <IconButton
                                    onClick={() => messageListToBottom()}
                                    sx={{ visibility: atScrollBottom ? "hidden" : "visible", }}>
                                    <ArrowCircleDownIcon />
                                </IconButton>
                            </ButtonGroup>)}
                            <MessageInput
                                currentSessionId={currentSession.id}
                                messageScrollRef={messageScrollRef}
                                textareaRef={textareaRef}
                            />
                        </Box>
                    </Stack>
                </Grid>

                <SettingWindow open={!!openSettingWindow}
                    targetTab={openSettingWindow || undefined}
                    close={() => setOpenSettingWindow(null)}
                />
                <AboutWindow open={openAboutWindow} version={versionHook.version} lang={settings.language}
                    close={() => setOpenAboutWindow(false)}
                />
                {
                    configureChatConfig !== null && (
                        <ChatConfigWindow open={configureChatConfig !== null}
                            session={configureChatConfig}
                            close={() => setConfigureChatConfig(null)}
                        />
                    )
                }
                {
                    sessionClean !== null && (
                        <CleanWidnow open={sessionClean !== null}
                            close={() => setSessionClean(null)}
                        />
                    )
                }
                <CopilotWindow open={openCopilotWindow}
                    // premiumActivated={store.premiumActivated}
                    // openPremiumPage={() => {
                    //     setOpenSettingWindow('premium')
                    // }}
                    close={() => setOpenCopilotWindow(false)}
                />
                <Toasts />
            </Grid>
        </Box >
    );
}

export default function App() {
    useI18nEffect()
    useAnalytics()
    const theme = useThemeSwicher()
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Main />
        </ThemeProvider>
    )
}
