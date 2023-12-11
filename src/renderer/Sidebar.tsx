import React, { useRef } from 'react'
import SwipeableDrawer from '@mui/material/SwipeableDrawer'
import {
    Box,
    Badge,
    ListItemText,
    MenuList,
    IconButton,
    Stack,
    MenuItem,
    ListItemIcon,
    Typography,
    Divider,
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
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'

export const drawerWidth = 240

interface Props {
    open: boolean
    swtichOpen(open: boolean): void

    setConfigureChatConfig(session: Session | null): void
    openClearConversationListWindow(): void
    openCopilotWindow(): void
    openAboutWindow(): void
    setOpenSettingWindow(name: 'ai' | 'display' | null): void
}

export default function Sidebar(props: Props) {
    const { t } = useTranslation()
    const versionHook = useVersion()
    const setShowSidebar = useSetAtom(atoms.showSidebarAtom)

    const sessionListRef = useRef<HTMLDivElement>(null)
    const handleCreateNewSession = () => {
        sessionActions.createEmpty('chat')
        if (sessionListRef.current) {
            sessionListRef.current.scrollTo(0, 0)
        }
        window.gtag('event', 'create_new_conversation', { event_category: 'user' })
    }
    const handleCreateNewPictureSession = () => {
        sessionActions.createEmpty('picture')
        if (sessionListRef.current) {
            sessionListRef.current.scrollTo(0, 0)
        }
        window.gtag('event', 'create_new_picture_conversation', { event_category: 'user' })
    }

    const stack = (
        <div className="ToolBar h-full">
            <Stack
                sx={{
                    height: '100%',
                    paddingTop: '1rem',
                    paddingLeft: '1rem',
                }}
            >
                <Box className="flex justify-between items-center p-0 m-0 mx-2 mb-4">
                    <Box>
                        <a href="https://chatboxai.app" target="_blank">
                            <img src={icon} className="w-8 h-8 mr-2 align-middle inline-block" />
                            <span className="text-2xl align-middle inline-block">Chatbox</span>
                        </a>
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

                <MenuList sx={{ marginBottom: '20px' }}>
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

                    <MenuItem
                        onClick={handleCreateNewPictureSession}
                        sx={{ padding: '0.2rem 0.1rem', margin: '0.1rem' }}
                    >
                        <ListItemIcon>
                            <IconButton>
                                <AddPhotoAlternateIcon fontSize="small" />
                            </IconButton>
                        </ListItemIcon>
                        <ListItemText>{t('New Images')}</ListItemText>
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
                                    {t('About')}
                                    {versionHook.version !== '' ? `(${versionHook.version})` : ''}
                                </Typography>
                            </Badge>
                        </ListItemText>
                    </MenuItem>
                </MenuList>
            </Stack>
        </div>
    )

    return (
        <div>
            {/* 移动端 */}
            <SwipeableDrawer
                anchor="left"
                open={props.open}
                onClose={() => props.swtichOpen(false)}
                onOpen={() => props.swtichOpen(true)}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                    },
                }}
            >
                {stack}
            </SwipeableDrawer>

            {/* 桌面、宽屏幕 */}
            <SwipeableDrawer
                anchor="left"
                variant="persistent"
                open={props.open}
                onClose={() => props.swtichOpen(false)}
                onOpen={() => props.swtichOpen(true)}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        border: 'none',
                    },
                }}
            >
                {stack}
            </SwipeableDrawer>
        </div>
    )
}
