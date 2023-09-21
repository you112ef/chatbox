import React, { useEffect } from 'react'
import { Button, Tabs, Tab, Dialog, DialogContent, DialogActions, DialogTitle, Box } from '@mui/material'
import { Settings, ThemeMode } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import { useAtom } from 'jotai'
import { settingsAtom } from '../../stores/atoms'
import { switchTheme } from '../../hooks/useThemeSwitcher'
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined'
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness'
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined'
import KeyboardAltOutlinedIcon from '@mui/icons-material/KeyboardAltOutlined'
import ShortcutTab from './ShortcutTab'
import ChatSettingTab from './ChatSettingTab'
import DisplaySettingTab from './DisplaySettingTab'
import ModelSettingTab from './ModelSettingTab'
import { resetTokenConfig } from '../../packages/token_config'

type Tab = 'ai' | 'display' | 'chat' | 'shortcut'

interface Props {
    open: boolean
    targetTab?: Tab
    close(): void
}

export default function SettingWindow(props: Props) {
    const { t } = useTranslation()
    const [settings, setSettings] = useAtom(settingsAtom)

    // 标签页控制
    const [currentTab, setCurrentTab] = React.useState<Tab>('ai')
    useEffect(() => {
        if (props.targetTab) {
            setCurrentTab(props.targetTab)
        }
    }, [props.targetTab, props.open])
    useEffect(() => {
        if (props.open) {
            window.gtag('event', 'screen_view', { screen_name: 'setting_window' })
        }
    }, [props.open])

    const [settingsEdit, _setSettingsEdit] = React.useState<Settings>(settings)
    const setSettingsEdit = (updated: Settings) => {
        // 切换模型提供方或模型版本时，需重设 token 配置为默认值
        if (settingsEdit?.aiProvider !== updated.aiProvider || settingsEdit?.model !== updated.model) {
            updated = { ...updated, ...resetTokenConfig(updated) }
        }
        _setSettingsEdit(updated)
    }

    useEffect(() => {
        setSettingsEdit(settings)
    }, [settings])

    const onSave = () => {
        setSettings(settingsEdit)
        props.close()
    }

    const onCancel = () => {
        props.close()
        setSettingsEdit(settings)
        // need to restore the previous theme
        switchTheme(settings.theme ?? ThemeMode.System)
    }

    // preview theme
    const changeModeWithPreview = (newMode: ThemeMode) => {
        setSettingsEdit({ ...settingsEdit, theme: newMode })
        switchTheme(newMode)
    }

    return (
        <Dialog open={props.open} onClose={onCancel} fullWidth classes={{ paper: 'h-4/5' }}>
            <DialogTitle>{t('settings')}</DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        marginBottom: '20px',
                    }}
                >
                    <Tabs
                        value={currentTab}
                        onChange={(_, value) => setCurrentTab(value)}
                        centered
                        variant="scrollable"
                        scrollButtons
                        allowScrollButtonsMobile
                    >
                        <Tab
                            value="ai"
                            label={
                                <span className="inline-flex justify-center items-center">
                                    <SmartToyOutlinedIcon fontSize="small" style={{ marginRight: 5 }} />
                                    <span>{t('model')}</span>
                                </span>
                            }
                        />
                        <Tab
                            value="display"
                            label={
                                <span className="inline-flex justify-center items-center">
                                    <SettingsBrightnessIcon fontSize="small" style={{ marginRight: 5 }} />
                                    <span>{t('display')}</span>
                                </span>
                            }
                        />
                        <Tab
                            value="chat"
                            label={
                                <span className="inline-flex justify-center items-center">
                                    <ChatOutlinedIcon fontSize="small" style={{ marginRight: 5 }} />
                                    <span>{t('chat')}</span>
                                </span>
                            }
                        />
                        <Tab
                            value="shortcut"
                            label={
                                <span className="inline-flex justify-center items-center">
                                    <KeyboardAltOutlinedIcon fontSize="small" style={{ marginRight: 5 }} />
                                    <span>{t('Shortcuts')}</span>
                                </span>
                            }
                        />
                        {/* <Tab label={t('premium')} value='premium' /> */}
                    </Tabs>
                </Box>

                {currentTab === 'ai' && (
                    <ModelSettingTab
                        settingsEdit={settingsEdit}
                        setSettingsEdit={(updated) => {
                            setSettingsEdit({ ...settingsEdit, ...updated })
                        }}
                    />
                )}

                {currentTab === 'display' && (
                    <DisplaySettingTab
                        settingsEdit={settingsEdit}
                        setSettingsEdit={(updated) => {
                            setSettingsEdit({ ...settingsEdit, ...updated })
                        }}
                        changeModeWithPreview={changeModeWithPreview}
                    />
                )}

                {currentTab === 'chat' && (
                    <ChatSettingTab
                        settingsEdit={settingsEdit}
                        setSettingsEdit={(updated) => {
                            setSettingsEdit({ ...settingsEdit, ...updated })
                        }}
                    />
                )}

                {currentTab === 'shortcut' && (
                    <ShortcutTab
                        settingsEdit={settingsEdit}
                        setSettingsEdit={(updated) => {
                            setSettingsEdit({ ...settingsEdit, ...updated })
                        }}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{t('cancel')}</Button>
                <Button onClick={onSave}>{t('save')}</Button>
            </DialogActions>
        </Dialog>
    )
}
