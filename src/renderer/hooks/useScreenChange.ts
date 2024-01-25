import { useTheme, useMediaQuery } from '@mui/material'
import { useSetAtom } from 'jotai'
import * as atoms from '../stores/atoms'
import { useEffect } from 'react'

export default function useScreenChange() {
    const setShowSidebar = useSetAtom(atoms.showSidebarAtom)
    const realIsSmallScreen = useIsSmallScreen()
    useEffect(() => {
        setShowSidebar(!realIsSmallScreen)
    }, [realIsSmallScreen])
}

export function useIsSmallScreen() {
    const theme = useTheme()
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
    return isSmallScreen
}
