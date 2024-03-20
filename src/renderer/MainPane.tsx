import { useEffect } from 'react'
import { Box, IconButton, ButtonGroup } from '@mui/material'
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp'
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown'
import SponsorChip from './components/SponsorChip'
import * as atoms from './stores/atoms'
import { useAtom, useAtomValue } from 'jotai'
import InputBox from './components/InputBox'
import MessageList from './components/MessageList'
import * as scrollActions from './stores/scrollActions'
import { drawerWidth } from './Sidebar'
import { useIsSmallScreen } from './hooks/useScreenChange'
import Header from './components/Header'

interface Props {}

export default function MainPane(props: Props) {
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const [showSidebar] = useAtom(atoms.showSidebarAtom)

    const atScrollTop = useAtomValue(atoms.messageScrollingAtTopAtom)
    const atScrollBottom = useAtomValue(atoms.messageScrollingAtBottomAtom)
    const isSmallScreen = useIsSmallScreen()

    useEffect(() => {
        setTimeout(() => {
            scrollActions.scrollToBottom('auto') // 每次启动时自动滚动到底部
        }, 200)
    }, [])

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
                <Header />
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
