import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import SearchIcon from '@mui/icons-material/Search'
import Save from '@mui/icons-material/Save'
import { useAtomValue, useSetAtom } from 'jotai'
import * as atoms from '../stores/atoms'
import { useTranslation } from 'react-i18next'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import StyledMenu from './StyledMenu'
import { useState } from 'react'
import { MenuItem, Divider } from '@mui/material'
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import { Message } from 'src/shared/types'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import platform from '@/platform'

/**
 * 顶部标题工具栏（右侧）
 * @returns
 */
export default function Toolbar() {
    const { t } = useTranslation()
    const isSmallScreen = useIsSmallScreen()
    const currentSession = useAtomValue(atoms.currentSessionAtom)

    const setOpenSearchDialog = useSetAtom(atoms.openSearchDialogAtom)
    const setThreadHistoryDrawerOpen = useSetAtom(atoms.showThreadHistoryDrawerAtom)
    const setSessionCleanDialog = useSetAtom(atoms.sessionCleanDialogAtom)

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)

    const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        event.preventDefault()
        setAnchorEl(event.currentTarget)
    }
    const handleMoreMenuClose = () => {
        setAnchorEl(null)
    }
    const handleExportAndSave = () => {
        const messageList: Message[] = []
        if (currentSession.threads) {
            for (const h of currentSession.threads) {
                messageList.push(...h.messages)
            }
        }
        messageList.push(...currentSession.messages)
        const content = messageList
            .map((msg) => `**${msg.role}**:\n${msg.content}`)
            .join('\n\n--------------------\n\n')
        platform.exporter.exportTextFile('Export.md', content)
        handleMoreMenuClose()
    }
    const handleSessionClean = () => {
        setSessionCleanDialog(currentSession)
        handleMoreMenuClose()
    }

    return (
        <Box>
            {isSmallScreen ? (
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{ mr: 2 }}
                    onClick={() => setOpenSearchDialog(true)}
                >
                    <SearchIcon />
                </IconButton>
            ) : (
                <Button
                    component="label"
                    variant="outlined"
                    color="inherit"
                    startIcon={<SearchIcon />}
                    sx={{ mr: 3 }}
                    onClick={() => setOpenSearchDialog(true)}
                    size="small"
                    className="transform-none opacity-30"
                >
                    <span
                        className="justify-between transform-none text-sm"
                        style={{ textTransform: 'none' }}
                    >
                        <span className="mr-1">{t('Search')}...</span>
                        {/* <span className='text-xs bg-slate-600 opacity-60 text-white border border-solid px-0.5 border-slate-600'>
                                    Ctrl K
                                </span> */}
                    </span>
                </Button>
            )}
            {/* <IconButton
                edge="start"
                color="inherit"
                aria-label="thread-history-drawer-button"
                sx={{ mr: 2 }}
                onClick={() => setThreadHistoryDrawerOpen(true)}
            >
                <HistoryIcon />
            </IconButton> */}
            <IconButton
                edge="start"
                color="inherit"
                aria-label="more-menu-button"
                sx={{}}
                onClick={handleMoreMenuOpen}
            >
                <MoreHorizIcon />
            </IconButton>
            <StyledMenu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMoreMenuClose}
            >
                <MenuItem onClick={handleExportAndSave} disableRipple >
                    <Save fontSize='small' />
                    {t('Export Chat')}
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={handleSessionClean} disableRipple >
                    <CleaningServicesIcon fontSize="small" />
                    {t('Clear All Messages')}
                </MenuItem>
            </StyledMenu>
        </Box>
    )
}
