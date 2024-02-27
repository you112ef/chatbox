import { useEffect } from 'react'
import { Box, IconButton, ButtonGroup, Stack, Typography, Chip, Tooltip, useTheme } from '@mui/material'
import { isChatSession, isPictureSession } from '../shared/types'
import { useTranslation } from 'react-i18next'
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

interface Props {}

export default function MainPane(props: Props) {
    const { t } = useTranslation()
    const theme = useTheme()
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const setChatConfigDialogSession = useSetAtom(atoms.chatConfigDialogAtom)
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
        setChatConfigDialogSession(currentSession)
    }

    return (
        <Box
            className="h-full w-full"
            sx={{
                flexGrow: 1,
                ...(showSidebar && {
                    marginLeft: { sm: `${drawerWidth}px` },
                }),
            }}
        >
            <div className="flex flex-col h-full">
                {
                    // 小屏幕的广告UI
                    isSmallScreen && (
                        <Box className="text-center">
                            <SponsorChip sessionId={currentSession.id} />
                        </Box>
                    )
                }
                <div
                    className="flex flex-row pt-3 pb-2 px-0.5 sm:px-4"
                    style={{
                        borderBottomWidth: '1px',
                        borderBottomStyle: 'solid',
                        borderBottomColor: theme.palette.divider,
                    }}
                >
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
                </div>
                <MessageList />
                <Box className="relative">
                    <ButtonGroup
                        sx={{
                            position: 'absolute',
                            right: '0.8rem',
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
                </Box>
                <InputBox currentSessionId={currentSession.id} currentSessionType={currentSession.type} />
            </div>
        </Box>
    )
}
