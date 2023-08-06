import { useTheme, useMediaQuery } from '@mui/material'
import { useSetAtom } from 'jotai'
import * as atoms from '../stores/atoms'
import { useEffect } from 'react'

export default function useScreenChange() {
    const setShowSidebar = useSetAtom(atoms.showSidebarAtom)
    const setIsSmallScreen = useSetAtom(atoms.isSmallScreenAtom)

    const theme = useTheme()
    const realIsSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

    useEffect(() => {
        setIsSmallScreen(realIsSmallScreen)
        setShowSidebar(!realIsSmallScreen)
    }, [realIsSmallScreen])
}
