import { useEffect } from 'react'
import { Button, Box, IconButton, ButtonGroup, Stack, Grid, Typography, Chip, Tooltip } from '@mui/material'
import { Session, getMsgDisplayModelName } from '../shared/types'
import CleaningServicesIcon from '@mui/icons-material/CleaningServices'
import Save from '@mui/icons-material/Save'
import { useTranslation } from 'react-i18next'
import icon from './static/icon.png'
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp'
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown'
import SponsorChip from './components/SponsorChip'
import * as api from './packages/runtime'
import * as atoms from './stores/atoms'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import InputBox from './components/InputBox'
import MessageList from './components/MessageList'
import * as sessionActions from './stores/sessionActions'
import * as scrollActions from './stores/scrollActions'
import TuneIcon from '@mui/icons-material/Tune'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import SearchIcon from '@mui/icons-material/Search'

interface Props {
    setConfigureChatConfig(session: Session | null): void
    setSessionClean(session: Session | null): void
}

export default function MainPane(props: Props) {
    const { t } = useTranslation()
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const [showSidebar, setShowSidebar] = useAtom(atoms.showSidebarAtom)

    const atScrollTop = useAtomValue(atoms.messageScrollingAtTopAtom)
    const atScrollBottom = useAtomValue(atoms.messageScrollingAtBottomAtom)

    const setOpenSearchDialog = useSetAtom(atoms.openSearchDialogAtom)
    const openSearchDialog = () => setOpenSearchDialog(true)

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

    const exportSession = async (session: Session) => {
        const content = session.messages
            .map((msg) => `**${msg.role}**:\n${msg.content}`)
            .join('\n\n--------------------\n\n')
        return api.exportTextFile('Export.md', content)
    }

    return (
        <Grid item xs className="h-full">
            <Stack className="h-full relative">
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
                        {currentSession.settings && (
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
                                            {getMsgDisplayModelName(currentSession.settings)}
                                        </span>
                                    }
                                />
                            </Tooltip>
                        )}
                    </Typography>
                    <SponsorChip sessionId={currentSession.id} />
                    <Box>
                        <Button
                            component="label"
                            variant='outlined'
                            color='inherit'
                            startIcon={<SearchIcon />}
                            sx={{ mr: 2 }}
                            onClick={openSearchDialog}
                            size='small'
                            className='transform-none opacity-30'
                        >
                            <span className='justify-between transform-none text-sm' style={{ textTransform: 'none' }}>
                                <span className='mr-1'>
                                    {t('Search')}...
                                </span>
                                {/* <span className='text-xs bg-slate-600 opacity-60 text-white border border-solid px-0.5 border-slate-600'>
                                    Ctrl K
                                </span> */}
                            </span>
                        </Button>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{ mr: 2 }}
                            onClick={() => props.setSessionClean(currentSession)}
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
                    </Box>
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
                    <InputBox currentSessionId={currentSession.id} />
                </Box>
            </Stack>
        </Grid>
    )
}
