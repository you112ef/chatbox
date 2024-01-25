import { useEffect } from 'react'
import { Box, IconButton, ButtonGroup, Stack, Typography, Chip, Tooltip } from '@mui/material'
import { Session, isChatSession, isPictureSession } from '../shared/types'
import { useTranslation } from 'react-i18next'
import icon from './static/icon.png'
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp'
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown'
import SponsorChip from './components/SponsorChip'
import * as atoms from './stores/atoms'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import InputBox from './components/InputBox'
import MessageList from './components/MessageList'
import * as sessionActions from './stores/sessionActions'
import * as scrollActions from './stores/scrollActions'
import TuneIcon from '@mui/icons-material/Tune'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import { drawerWidth } from './Sidebar'
import ImageIcon from '@mui/icons-material/Image'
import Toolbar from './components/Toolbar'
import { getModelDisplayName } from '@/packages/models'
import { useIsSmallScreen } from './hooks/useScreenChange'

interface Props {
    setConfigureChatConfig(session: Session | null): void
}

export default function MainPane(props: Props) {
    const { t } = useTranslation()
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const [showSidebar, setShowSidebar] = useAtom(atoms.showSidebarAtom)

    const atScrollTop = useAtomValue(atoms.messageScrollingAtTopAtom)
    const atScrollBottom = useAtomValue(atoms.messageScrollingAtBottomAtom)
    const isSmallScreen = useIsSmallScreen()

    // 会话名称自动生成
    useEffect(() => {
        if (
            currentSession.name === 'Untitled' &&
            currentSession.messages.findIndex((msg) => msg.role === 'assistant' && !msg.generating) !== -1
        ) {
            sessionActions.generateName(currentSession.id)
        }
    }, [currentSession.messages])

    const editCurrentSession = () => {
        props.setConfigureChatConfig(currentSession)
    }

    return (
        <Box
            className="h-full w-full"
            sx={{
                flexGrow: 1,
                ...(showSidebar && {
                    marginLeft: { sm: `calc(${drawerWidth}px - 1rem)` },
                }),
            }}
        >
            <Stack className="h-full relative">
                {
                    // 小屏幕的广告UI
                    isSmallScreen && (
                        <Box className="text-center">
                            <SponsorChip sessionId={currentSession.id} />
                        </Box>
                    )
                }
                <Box className="flex flex-row">
                    {!showSidebar && (
                        <Box className="mr-1">
                            <IconButton onClick={() => setShowSidebar(!showSidebar)}>
                                <MenuOpenIcon className="text-xl" sx={{ transform: 'rotate(180deg)' }} />
                            </IconButton>
                        </Box>
                    )}
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
                        className="flex items-center cursor-pointer"
                        onClick={() => {
                            editCurrentSession()
                        }}
                    >
                        {!showSidebar ? (
                            <>
                                <img className="w-7 h-7" src={icon} />
                                <Typography variant="h6" noWrap className="ml-1 max-w-56">
                                    {currentSession.name}
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="h6" noWrap className="ml-3 max-w-56">
                                {currentSession.name}
                            </Typography>
                        )}
                        {isChatSession(currentSession) && currentSession.settings && (
                            <Tooltip
                                title={t('Current conversation configured with specific model settings')}
                                className="cursor-pointer"
                            >
                                <Chip
                                    className="ml-2 cursor-pointer"
                                    variant="outlined"
                                    color="warning"
                                    size="small"
                                    icon={<TuneIcon className="cursor-pointer" />}
                                    label={
                                        <span className="cursor-pointer">
                                            {getModelDisplayName(currentSession.settings, currentSession.type)}
                                        </span>
                                    }
                                />
                            </Tooltip>
                        )}
                        {isPictureSession(currentSession) && (
                            <Tooltip
                                title={t('The Image Creator plugin has been activated for the current conversation')}
                                className="cursor-pointer"
                            >
                                <Chip
                                    className="ml-2 cursor-pointer"
                                    variant="outlined"
                                    color="secondary"
                                    size="small"
                                    icon={<ImageIcon className="cursor-pointer" />}
                                    label={<span className="cursor-pointer">{t('Image Creator')}</span>}
                                />
                            </Tooltip>
                        )}
                    </Typography>
                    {
                        // 大屏幕的广告UI
                        !isSmallScreen && <SponsorChip sessionId={currentSession.id} />
                    }
                    <Toolbar />
                </Box>
                <MessageList />
                <Box className="relative py-5">
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
                            onClick={() => scrollActions.scrollToTop()}
                            sx={{
                                visibility: atScrollTop ? 'hidden' : 'visible',
                            }}
                        >
                            <ArrowCircleUpIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => scrollActions.scrollToBottom()}
                            sx={{
                                visibility: atScrollBottom ? 'hidden' : 'visible',
                            }}
                        >
                            <ArrowCircleDownIcon />
                        </IconButton>
                    </ButtonGroup>
                    <InputBox currentSessionId={currentSession.id} currentSessionType={currentSession.type} />
                </Box>
            </Stack>
        </Box>
    )
}
