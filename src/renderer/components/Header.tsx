import { useEffect, useMemo } from 'react'
import { Box, IconButton, Typography, Chip, Tooltip, useTheme } from '@mui/material'
import { isChatSession, isPictureSession } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import SponsorChip from './SponsorChip'
import * as atoms from '../stores/atoms'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import * as sessionActions from '../stores/sessionActions'
import TuneIcon from '@mui/icons-material/Tune'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import ImageIcon from '@mui/icons-material/Image'
import Toolbar from './Toolbar'
import { getModelDisplayName } from '@/packages/models'
import { useIsSmallScreen } from '../hooks/useScreenChange'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props { }

export default function Header(props: Props) {
    const { t } = useTranslation()
    const theme = useTheme()
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const widthFull = useAtomValue(atoms.widthFullAtom)
    const setChatConfigDialogSession = useSetAtom(atoms.chatConfigDialogAtom)
    const [showSidebar, setShowSidebar] = useAtom(atoms.showSidebarAtom)
    const selectedCustomProviderId = useAtomValue(atoms.selectedCustomProviderIdAtom)

    const isSmallScreen = useIsSmallScreen()

    // 会话名称自动生成
    useEffect(() => {
        if (
            currentSession.name === 'Untitled'
            && currentSession.messages.length >= 2
        ) {
            sessionActions.generateNameAndThreadName(currentSession.id)
            return  // 生成了会话名称，就不再生成 thread 名称
        }
        if (
            !currentSession.threadName
            && currentSession.messages.length >= 2
        ) {
            sessionActions.generateThreadName(currentSession.id)
        }
    }, [currentSession.messages.length])

    const editCurrentSession = () => {
        setChatConfigDialogSession(currentSession)
    }

    const currentSessionMergeSettings = useMemo(() => {
        return sessionActions.getCurrentSessionMergedSettings()
    }, [currentSession.id, currentSession.settings, selectedCustomProviderId])

    let EditButton: React.ReactNode | null = null
    if (isChatSession(currentSession) && (currentSession.settings || currentSessionMergeSettings.selectedCustomProviderId)) {
        const modelName = getModelDisplayName(currentSessionMergeSettings, currentSession.type || 'chat')
        if (modelName === '' || modelName === 'unknown') {
            EditButton = (
                <Pencil className="ml-1 cursor-pointer w-4 h-4" fontSize="small"
                    style={{ color: theme.palette.warning.main }}
                />
            )
        } else {
            EditButton = (
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
                                {modelName}
                            </span>
                        }
                    />
                </Tooltip>
            )
        }
    } else if (isPictureSession(currentSession)) {
        EditButton = (
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
        )
    } else {
        EditButton = (
            <Pencil className="ml-1 cursor-pointer opacity-30 w-4 h-4" fontSize="small" />
        )
    }

    return (
        <div
            className="pt-3 pb-2 px-0.5 sm:px-4"
            style={{
                borderBottomWidth: '1px',
                borderBottomStyle: 'solid',
                borderBottomColor: theme.palette.divider,
            }}
        >
            <div className={cn('w-full mx-auto flex flex-row', widthFull ? '' : 'max-w-5xl')}>
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
                    {
                        <Typography variant="h6" noWrap className={cn('max-w-56', showSidebar ? 'ml-3' : 'ml-1')}>
                            {currentSession.name}
                        </Typography>
                    }
                    {EditButton}
                </Typography>
                {
                    // 大屏幕的广告UI
                    !isSmallScreen && <SponsorChip sessionId={currentSession.id} />
                }
                <Toolbar />
            </div>
        </div>
    )
}
