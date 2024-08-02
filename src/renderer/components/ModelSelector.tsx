import React, { useEffect, useState } from 'react'
import { useTheme } from '@mui/material'
import * as atoms from '../stores/atoms'
import { useAtomValue } from 'jotai'
import { Sparkles, ChevronsUpDown } from 'lucide-react'
import MiniButton from './MiniButton'
import _ from 'lodash'
import MenuItem from '@mui/material/MenuItem';
import StyledMenu from './StyledMenu'
import * as sessionActions from '@/stores/sessionActions'
import { getModelSettingUtil } from '@/packages/model-setting-utils'
import { useIsSmallScreen } from '@/hooks/useScreenChange'

export function ChatModelSelector(props: {}) {
    const currentMergedSettings = useAtomValue(atoms.currentMergedSettingsAtom)

    const theme = useTheme()

    const currentSessionId = useAtomValue(atoms.currentSessionIdAtom)

    const modelSettingUtil = getModelSettingUtil(currentMergedSettings.aiProvider)

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }
    const handleMenuClose = () => {
        setAnchorEl(null);
    }
    const handleMenuItemSelect = (option: string) => {
        const currentSession = sessionActions.getSession(currentSessionId)
        if (!currentSession) {
            return
        }
        // currentSession.settigns 需要更新对象指针，以触发 atom 变化
        currentSession.settings = modelSettingUtil.selectSessionModel(currentSession.settings, option)

        sessionActions.modify({ ...currentSession })
        handleMenuClose()
    }

    const ITEM_HEIGHT = 48;

    const selectedModelOption = modelSettingUtil.getCurrentModelOption(currentMergedSettings)

    const [options, setOptions] = useState<{ label: string, value: string }[]>([])

    useEffect(() => {
        if (!open) {
            return
        }
        ; (async () => {
            const availableModelOptions = await modelSettingUtil.listModelOptions(currentMergedSettings)
            setOptions(availableModelOptions)
        })()
    }, [open])

    const isSmallScreen = useIsSmallScreen()

    return (
        <div>
            {
                isSmallScreen
                    ? (
                        <MiniButton className='w-auto flex items-center'
                            style={{ color: theme.palette.text.primary }}
                            onClick={handleMenuOpen}
                        >
                            <Sparkles size='20' strokeWidth={1} />
                            <ChevronsUpDown size='16' strokeWidth={1} className='opacity-50' />
                        </MiniButton>
                    )
                    : (
                        <MiniButton className='mr-2 w-auto flex items-center'
                            style={{ color: theme.palette.text.primary }}
                            onClick={handleMenuOpen}
                        >
                            <span className='text-sm opacity-70'>
                                {selectedModelOption.label}
                            </span>
                            <ChevronsUpDown size='16' strokeWidth={1} className='opacity-50' />
                        </MiniButton>
                    )
            }
            <StyledMenu
                MenuListProps={{
                    'aria-labelledby': '',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                PaperProps={{
                    style: {
                        maxHeight: ITEM_HEIGHT * 4.5,
                        marginTop: '0px', // 调整弹出菜单的位置
                    },
                }}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                elevation={0}
            >
                {options.map((option) => (
                    <MenuItem
                        key={option.value}
                        selected={option.value === selectedModelOption.value}
                        onClick={() => handleMenuItemSelect(option.value)}
                        dense
                    >
                        {option.label}
                    </MenuItem>
                ))}
            </StyledMenu>
        </div>
    );
}
