import { Chip, MenuItem, useTheme, Typography, Box } from '@mui/material'
import { CustomProvider, ModelProvider, ModelSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import { AIModelProviderMenuOptionList } from '../packages/models'
import * as React from 'react';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import StyledMenu from './StyledMenu';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import StarIcon from '@mui/icons-material/Star';

interface ModelConfigProps {
    settings: ModelSettings
    setSettings(value: ModelSettings): void
    className?: string
    hideCustomProviderManage?: boolean
}

export default function AIProviderSelect(props: ModelConfigProps) {
    const { settings, setSettings, className, hideCustomProviderManage } = props
    const { t } = useTranslation()
    const theme = useTheme()

    const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
    const menuState = Boolean(menuAnchorEl);
    const openMenu = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };
    const closeMenu = () => {
        setMenuAnchorEl(null);
    };

    const createCustomProvider = () => {
        const newCustomProvider: CustomProvider = {
            id: `custom-provider-${Date.now()}`,
            name: t('Untitled'),
            api: 'openai',
            host: 'https://api.openai.com',
            path: '/v1/chat/completions',
            key: '',
            model: 'gpt-4o',
        }
        setSettings({
            ...settings,
            aiProvider: ModelProvider.Custom,
            selectedCustomProviderId: newCustomProvider.id,
            customProviders: [
                newCustomProvider,
                ...settings.customProviders,
            ],
        })
        closeMenu()
    }

    const deleteCustomProvider = (providerId: string) => {
        const customProviders = settings.customProviders.filter((provider) => provider.id !== providerId)
        if (customProviders.length > 0) {
            setSettings({
                ...settings,
                customProviders,
                selectedCustomProviderId: customProviders[0].id,
            })
            return
        } else {
            setSettings({
                ...settings,
                customProviders,
                selectedCustomProviderId: undefined,
                aiProvider: ModelProvider.ChatboxAI,
            })
        }
    }

    const copyCustomProvider = (providerId: string) => {
        const customProvider = settings.customProviders.find((provider) => provider.id === providerId)
        if (!customProvider) {
            return
        }
        const newCustomProvider: CustomProvider = {
            ...customProvider,
            id: `custom-provider-${Date.now()}`,
            name: `${customProvider.name} (copy)`,
        }
        setSettings({
            ...settings,
            customProviders: [
                newCustomProvider,
                ...settings.customProviders,
            ],
            selectedCustomProviderId: newCustomProvider.id,
        })
    }

    const AddProviderMenuItem = (
        <MenuItem disableRipple
            onClick={createCustomProvider}
        >
            <AddCircleOutlineIcon />
            {t('Add Custom Provider')}
        </MenuItem>
    )

    return (
        <>
            <Typography variant='caption' className='opacity-50'>
                {t('Model Provider')}:
            </Typography>
            <div className='flex items-end justify-between'>
                <Button
                    variant="contained"
                    disableElevation
                    onClick={openMenu}
                    endIcon={<KeyboardArrowDownIcon />}
                >
                    <Typography className='text-left' maxWidth={200} noWrap>
                        {
                            settings.aiProvider === ModelProvider.Custom
                                ? settings.customProviders.find((provider) => provider.id === settings.selectedCustomProviderId)?.name || t('Untitled')
                                : AIModelProviderMenuOptionList.find((provider) => provider.value === settings.aiProvider)?.label || 'Unknown'
                        }
                    </Typography>
                </Button>
                {
                    settings.aiProvider === ModelProvider.Custom && !hideCustomProviderManage && (
                        <Box className='inline-flex opacity-50 hover:opacity-100'>
                            <Button
                                size='small'
                                variant="outlined"
                                sx={{ marginRight: '6px' }}
                                onClick={() => copyCustomProvider(settings.selectedCustomProviderId || '')}
                            >
                                {t('copy')}
                            </Button>
                            <Button
                                size='small'
                                variant="outlined"
                                sx={{ marginRight: '6px' }}
                                onClick={() => deleteCustomProvider(settings.selectedCustomProviderId || '')}
                                color='error'
                            >
                                {t('delete')}
                            </Button>
                        </Box>
                    )
                }
                <StyledMenu
                    anchorEl={menuAnchorEl}
                    open={menuState}
                    onClose={closeMenu}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                >
                    {
                        settings.customProviders.length > 0 && (
                            <>
                                {
                                    settings.customProviders.map((provider) => (
                                        <MenuItem disableRipple
                                            onClick={() => {
                                                setSettings({
                                                    ...settings,
                                                    aiProvider: ModelProvider.Custom,
                                                    selectedCustomProviderId: provider.id,
                                                })
                                                closeMenu()
                                            }}
                                        >
                                            <DashboardCustomizeIcon />
                                            {provider.name || t('Untitled')}
                                        </MenuItem>
                                    ))
                                }
                                {AddProviderMenuItem}
                                <Divider sx={{ my: 0.5 }} />
                            </>
                        )
                    }
                    {
                        AIModelProviderMenuOptionList.map((provider) => (
                            <MenuItem disableRipple
                                onClick={() => {
                                    setSettings({
                                        ...settings,
                                        aiProvider: provider.value as ModelProvider,
                                    })
                                    closeMenu()
                                }}
                            >
                                <StarIcon />
                                {provider.label}
                                {provider.featured && (
                                    <Chip
                                        label={t('Easy Access')}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                        sx={{ marginLeft: '10px' }}
                                    />
                                )}
                            </MenuItem>
                        ))
                    }
                    {
                        settings.customProviders.length === 0 && (
                            <>
                                <Divider sx={{ my: 0.5 }} />
                                {AddProviderMenuItem}
                            </>
                        )
                    }
                </StyledMenu>
            </div>
        </>
    )
}

