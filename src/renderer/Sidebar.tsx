import React, { useRef } from 'react'
import {
    Toolbar,
    Box,
    Badge,
    ListItemText,
    MenuList,
    IconButton,
    Stack,
    Grid,
    MenuItem,
    ListItemIcon,
    Typography,
    Divider,
    useTheme,
} from '@mui/material'
import { Session } from '../shared/types'
import SettingsIcon from '@mui/icons-material/Settings'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useTranslation } from 'react-i18next'
import icon from './static/icon.png'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import useVersion from './hooks/useVersion'
import SessionList from './components/SessionList'
import * as sessionActions from './stores/sessionActions'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import { useSetAtom } from 'jotai'
import * as atoms from './stores/atoms'

interface Props {
    setConfigureChatConfig(session: Session | null): void
    openClearConversationListWindow(): void
    openCopilotWindow(): void
    openAboutWindow(): void
    setOpenSettingWindow(name: 'ai' | 'display' | null): void
}

export default function Sidebar(props: Props) {
    const { t } = useTranslation()
    const theme = useTheme()
    const versionHook = useVersion()
    const setShowSidebar = useSetAtom(atoms.showSidebarAtom)

    const sessionListRef = useRef<HTMLDivElement>(null)
    const handleCreateNewSession = () => {
        sessionActions.createEmpty()
        if (sessionListRef.current) {
            sessionListRef.current.scrollTo(0, 0)
        }
    }

    return (
        <Grid
            item
            sx={{
                height: '100%',
                [theme.breakpoints.down('sm')]: {
                    position: 'absolute',
                    zIndex: 100,
                    left: 0,
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
                        paddingTop: '1rem',
                        paddingLeft: '1rem',
                    },
                }}
            >
                <Box className="flex justify-between items-center p-0 m-0 mx-2 mb-4">
                    <Box>
                        <img src={icon} className="w-8 h-8 mr-2 align-middle inline-block" />
                        <span className="text-2xl align-middle inline-block">Chatbox</span>
                    </Box>
                    <Box>
                        <IconButton onClick={() => setShowSidebar(false)}>
                            <MenuOpenIcon className="text-xl" />
                        </IconButton>
                    </Box>
                </Box>

                <SessionList
                    setConfigureChatConfig={props.setConfigureChatConfig}
                    openClearWindow={props.openClearConversationListWindow}
                    sessionListRef={sessionListRef}
                />

                <Divider sx={{ margin: '0.5rem 0.3rem' }} />

                <MenuList>
                    <MenuItem onClick={handleCreateNewSession} sx={{ padding: '0.2rem 0.1rem', margin: '0.1rem' }}>
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

                    <MenuItem onClick={props.openCopilotWindow} sx={{ padding: '0.2rem 0.1rem', margin: '0.1rem' }}>
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
                            props.setOpenSettingWindow('ai')
                        }}
                        sx={{ padding: '0.2rem 0.1rem', margin: '0.1rem' }}
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

                    <MenuItem onClick={props.openAboutWindow} sx={{ padding: '0.2rem 0.1rem', margin: '0.1rem' }}>
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
                onClick={() => setShowSidebar(false)}
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
    )
}
