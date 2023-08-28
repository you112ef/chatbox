import React, { useEffect } from 'react'
import {
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    Button,
    Alert,
    Chip,
    Tabs,
    Tab,
    Divider,
    ButtonGroup,
    Card,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    TextField,
    FormGroup,
    FormControlLabel,
    Switch,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Slider,
    Typography,
    Box,
    useTheme,
} from '@mui/material'
import { Settings, ModelProvider, ThemeMode, ModelSettings } from '../../shared/types'
import ThemeChangeButton from '../theme/ThemeChangeIcon'
import { Trans, useTranslation } from 'react-i18next'
import * as defaults from '../stores/defaults'
import { useAtom } from 'jotai'
import { settingsAtom } from '../stores/atoms'
import { switchTheme } from '../hooks/useThemeSwitcher'
import * as runtime from '../packages/runtime'
import { usePremium } from '../hooks/usePremium'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { models, languageNameMap, languages, modelConfigs, aiModelProviderList } from '../config'
import { Accordion, AccordionSummary, AccordionDetails } from '../components/Accordion'
import TemperatureSlider from '../components/TemperatureSlider'
import PasswordTextField from '../components/PasswordTextField'
import MaxContextMessageCountSlider from '../components/MaxContextMessageCountSlider'
import { Shortcut } from '../components/Shortcut'
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined'
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness'
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined'
import TranslateIcon from '@mui/icons-material/Translate'
import KeyboardAltOutlinedIcon from '@mui/icons-material/KeyboardAltOutlined'
import ClaudeModelSelect from '../components/ClaudeModelSelect'
import ChatboxAIModelSelect from '../components/ChatboxAIModelSelect'

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

    const [settingsEdit, setSettingsEdit] = React.useState<Settings>(settings)

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
        <Dialog open={props.open} onClose={onCancel} fullWidth>
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
                    <Box>
                        <ModelConfig
                            settingsEdit={settingsEdit}
                            setSettingsEdit={(updated) => {
                                setSettingsEdit({ ...settingsEdit, ...updated })
                            }}
                        />
                    </Box>
                )}

                {currentTab === 'display' && (
                    <Box>
                        <FormControl fullWidth variant="outlined" margin="dense">
                            <InputLabel htmlFor="language-select">
                                <span className="inline-flex items-center justify-center">
                                    <TranslateIcon fontSize="small" />
                                    {t('language')}
                                </span>
                            </InputLabel>
                            <Select
                                label={
                                    <span className="inline-flex items-center justify-center">
                                        <TranslateIcon fontSize="small" />
                                        {t('language')}
                                    </span>
                                }
                                id="language-select"
                                value={settingsEdit.language}
                                onChange={(e) => {
                                    setSettingsEdit({
                                        ...settingsEdit,
                                        language: e.target.value as any,
                                    })
                                }}
                            >
                                {languages.map((language) => (
                                    <MenuItem key={language} value={language}>
                                        {languageNameMap[language]}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth variant="outlined" margin="dense">
                            <InputLabel>{t('Font Size')}</InputLabel>
                            <Select
                                labelId="select-font-size"
                                value={settingsEdit.fontSize}
                                label={t('Font Size')}
                                onChange={(event) => {
                                    setSettingsEdit({
                                        ...settingsEdit,
                                        fontSize: event.target.value as number,
                                    })
                                }}
                            >
                                {[10, 11, 12, 13, 14, 15, 16, 17, 18].map((size) => (
                                    <MenuItem key={size} value={size}>
                                        {size}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl
                            sx={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingTop: 1,
                                paddingBottom: 1,
                            }}
                        >
                            <span style={{ marginRight: 10 }}>{t('theme')}</span>
                            <ThemeChangeButton
                                value={settingsEdit.theme}
                                onChange={(theme) => changeModeWithPreview(theme)}
                            />
                        </FormControl>
                        <FormGroup>
                            <FormControlLabel
                                control={<Switch />}
                                label={t('show message word count')}
                                checked={settingsEdit.showWordCount}
                                onChange={(e, checked) =>
                                    setSettingsEdit({
                                        ...settingsEdit,
                                        showWordCount: checked,
                                    })
                                }
                            />
                            <FormControlLabel
                                control={<Switch />}
                                label={t('show message token count')}
                                checked={settingsEdit.showTokenCount}
                                onChange={(e, checked) =>
                                    setSettingsEdit({
                                        ...settingsEdit,
                                        showTokenCount: checked,
                                    })
                                }
                            />
                            <FormControlLabel
                                control={<Switch />}
                                label={t('show message token usage')}
                                checked={settingsEdit.showTokenUsed}
                                onChange={(e, checked) =>
                                    setSettingsEdit({
                                        ...settingsEdit,
                                        showTokenUsed: checked,
                                    })
                                }
                            />
                            <FormControlLabel
                                control={<Switch />}
                                label={t('show model name')}
                                checked={settingsEdit.showModelName}
                                onChange={(e, checked) =>
                                    setSettingsEdit({
                                        ...settingsEdit,
                                        showModelName: checked,
                                    })
                                }
                            />
                        </FormGroup>
                    </Box>
                )}

                {currentTab === 'chat' && (
                    <Box>
                        <TextField
                            autoFocus
                            margin="dense"
                            label={t('Default Prompt for New Conversation')}
                            fullWidth
                            variant="outlined"
                            value={settingsEdit.defaultPrompt || ''}
                            multiline
                            maxRows={8}
                            onChange={(e) =>
                                setSettingsEdit({
                                    ...settingsEdit,
                                    defaultPrompt: e.target.value.trim(),
                                })
                            }
                        />
                        <Button
                            size="small"
                            variant="text"
                            color="inherit"
                            sx={{ opacity: 0.5, textTransform: 'none' }}
                            onClick={() => {
                                setSettingsEdit({
                                    ...settingsEdit,
                                    defaultPrompt: defaults.getDefaultPrompt(),
                                })
                            }}
                        >
                            {t('Reset to Default')}
                        </Button>
                    </Box>
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

interface ConfigProps {
    settingsEdit: Settings
    setSettingsEdit: (settings: Settings) => void
}

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export function ModelConfig(props: ModelConfigProps) {
    const { t } = useTranslation()
    const premium = usePremium()

    const { settingsEdit, setSettingsEdit } = props

    const onlyShow = (provider: ModelProvider) => {
        return settingsEdit.aiProvider === provider ? 'block' : 'none'
    }
    return (
        <Box>
            <AiProviderSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            <Divider sx={{ margin: '12px 0' }} />
            <Box sx={{ display: onlyShow(ModelProvider.OpenAI) }}>
                <PasswordTextField
                    label={t('openai api key')}
                    value={settingsEdit.openaiKey}
                    setValue={(value) => {
                        setSettingsEdit({ ...settingsEdit, openaiKey: value })
                    }}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <>
                    <TextField
                        margin="dense"
                        label={t('api host')}
                        type="text"
                        fullWidth
                        variant="outlined"
                        placeholder="https://api.openai.com"
                        value={settingsEdit.apiHost}
                        onChange={(e) =>
                            setSettingsEdit({
                                ...settingsEdit,
                                apiHost: e.target.value.trim(),
                            })
                        }
                    />
                    {!settingsEdit.apiHost.match(/^(https?:\/\/)?api.openai.com(:\d+)?$/) && (
                        <Alert severity="warning">
                            {t('proxy warning', {
                                apiHost: settingsEdit.apiHost,
                            })}
                            <Button
                                onClick={() =>
                                    setSettingsEdit({
                                        ...settingsEdit,
                                        apiHost: defaults.settings().apiHost,
                                    })
                                }
                            >
                                {t('reset')}
                            </Button>
                        </Alert>
                    )}
                    {settingsEdit.apiHost.startsWith('http://') && (
                        <Alert severity="warning">
                            {<Trans i18nKey="protocol warning" components={{ bold: <strong /> }} />}
                        </Alert>
                    )}
                    {!settingsEdit.apiHost.startsWith('http') && (
                        <Alert severity="error">
                            {<Trans i18nKey="protocol error" components={{ bold: <strong /> }} />}
                        </Alert>
                    )}
                </>
                <Accordion>
                    <AccordionSummary aria-controls="panel1a-content">
                        <Typography>
                            {t('model')} & {t('token')}{' '}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Alert severity="warning">
                            {t('settings modify warning')}
                            {t('please make sure you know what you are doing.')}
                            {t('click here to')}
                            <Button
                                onClick={() =>
                                    setSettingsEdit(
                                        wrapDefaultTokenConfigUpdate({
                                            ...settingsEdit,
                                            model: defaults.settings().model,
                                            temperature: defaults.settings().temperature,
                                        })
                                    )
                                }
                            >
                                {t('reset')}
                            </Button>
                            {t('to default values.')}
                        </Alert>

                        <ModelSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />

                        <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />

                        <MaxContextMessageCountSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />

                        <TokenConfig settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                    </AccordionDetails>
                </Accordion>
            </Box>

            <Box sx={{ display: onlyShow(ModelProvider.Azure) }}>
                <TextField
                    placeholder="https://<resource_name>.openai.azure.com/"
                    autoFocus
                    margin="dense"
                    label={t('Azure Endpoint')}
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={settingsEdit.azureEndpoint}
                    onChange={(e) =>
                        setSettingsEdit({
                            ...settingsEdit,
                            azureEndpoint: e.target.value.trim(),
                        })
                    }
                />
                <PasswordTextField
                    label={t('Azure API Key')}
                    value={settingsEdit.azureApikey}
                    setValue={(value) => {
                        setSettingsEdit({ ...settingsEdit, azureApikey: value })
                    }}
                />
                <TextField
                    autoFocus
                    margin="dense"
                    label={t('Azure Deployment Name')}
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={settingsEdit.azureDeploymentName}
                    onChange={(e) =>
                        setSettingsEdit({
                            ...settingsEdit,
                            azureDeploymentName: e.target.value.trim(),
                        })
                    }
                />
                <Accordion>
                    <AccordionSummary aria-controls="panel1a-content">
                        <Typography>
                            {t('model')} & {t('token')}{' '}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Alert severity="warning">
                            {t('settings modify warning')}
                            {t('please make sure you know what you are doing.')}
                            {t('click here to')}
                            <Button
                                onClick={() =>
                                    setSettingsEdit(
                                        wrapDefaultTokenConfigUpdate({
                                            ...settingsEdit,
                                            model: defaults.settings().model,
                                            temperature: defaults.settings().temperature,
                                        })
                                    )
                                }
                            >
                                {t('reset')}
                            </Button>
                            {t('to default values.')}
                        </Alert>
                        <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                        <TokenConfig settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                    </AccordionDetails>
                </Accordion>
            </Box>

            <Box sx={{ display: onlyShow(ModelProvider.ChatGLM6B) }}>
                <TextField
                    placeholder="http://localhost:8000"
                    autoFocus
                    margin="dense"
                    label={t('ChatGLM-6B URL')}
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={settingsEdit.chatglm6bUrl}
                    onChange={(e) =>
                        setSettingsEdit({
                            ...settingsEdit,
                            chatglm6bUrl: e.target.value.trim(),
                        })
                    }
                    helperText={
                        <>
                            <Trans
                                i18nKey="ChatGLM-6B URL Helper"
                                components={[
                                    <a
                                        href={'https://github.com/THUDM/ChatGLM-6B#api%E9%83%A8%E7%BD%B2'}
                                        target="_blank"
                                    ></a>,
                                    <a href={'https://github.com/THUDM/ChatGLM-6B'} target="_blank"></a>,
                                ]}
                            />
                            {runtime.isWeb && (
                                <>
                                    <br />
                                    <Trans i18nKey="ChatGLM-6B Warnning for Chatbox-Web" />
                                </>
                            )}
                        </>
                    }
                />
            </Box>
            <Box sx={{ display: onlyShow(ModelProvider.ChatboxAI) }}>
                <Box>
                    <PasswordTextField
                        label={t('Chatbox AI License')}
                        value={settingsEdit.licenseKey || ''}
                        setValue={(value) => {
                            setSettingsEdit({ ...settingsEdit, licenseKey: value })
                        }}
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                        disabled={premium.premiumActivated || premium.premiumIsLoading}
                        helperText={
                            <span style={{ color: 'green' }}>
                                {premium.premiumActivated ? t('License Activated') : ''}
                            </span>
                        }
                    />
                    {!premium.premiumActivated && (
                        <Box>
                            <ButtonGroup
                                disabled={premium.premiumIsLoading}
                                aria-label="outlined primary button group"
                                sx={{ display: 'block', marginBottom: '15px' }}
                            >
                                <Button variant="text" onClick={() => premium.activate(settingsEdit.licenseKey || '')}>
                                    {premium.premiumIsLoading ? t('Activating...') : t('Activate License')}
                                </Button>
                            </ButtonGroup>
                        </Box>
                    )}
                    {settingsEdit.licenseDetail && (
                        <ChatboxAIModelSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                    )}
                    <Card sx={{ marginTop: '20px', padding: '14px' }} elevation={3}>
                        {premium.premiumActivated && (
                            <span
                                style={{
                                    fontWeight: 'bold',
                                    backgroundColor: 'green',
                                    color: 'white',
                                    padding: '2px 4px',
                                }}
                            >
                                {t('License Activated')}!
                            </span>
                        )}
                        <Typography sx={{ opacity: '1' }}>
                            {t('Chatbox AI provides an affordable solution to boost productivity with AI')}
                        </Typography>
                        <Box>
                            {[
                                t('Fast access to AI services'),
                                t('Hassle-free setup'),
                                t('Ideal for work and study'),
                            ].map((item) => (
                                <Box key={item} sx={{ display: 'flex', margin: '4px 0' }}>
                                    <CheckCircleOutlineIcon color={premium.premiumActivated ? 'success' : 'action'} />
                                    <b style={{ marginLeft: '5px' }}>{item}</b>
                                </Box>
                            ))}
                        </Box>
                        <Box sx={{ marginTop: '10px' }}>
                            {premium.premiumActivated ? (
                                <>
                                    <Button
                                        variant="outlined"
                                        sx={{ marginRight: '10px' }}
                                        onClick={() => {
                                            runtime.openLink('https://chatboxai.app/redirect_app/manage_license')
                                        }}
                                    >
                                        {t('Manage License and Devices')}
                                    </Button>
                                    <Button
                                        variant="text"
                                        sx={{ marginRight: '10px' }}
                                        onClick={() => {
                                            premium.deactivate()
                                        }}
                                    >
                                        {t('Deactivate')}
                                    </Button>
                                    <Button
                                        variant="text"
                                        sx={{ marginRight: '10px' }}
                                        onClick={() => {
                                            runtime.openLink('https://chatboxai.app/redirect_app/view_more_plans')
                                        }}
                                    >
                                        {t('View More Plans')}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outlined"
                                        sx={{ marginRight: '10px' }}
                                        onClick={() => {
                                            runtime.openLink('https://chatboxai.app/redirect_app/get_license')
                                        }}
                                    >
                                        {t('Get License')}
                                    </Button>
                                    <Button
                                        variant="text"
                                        sx={{ marginRight: '10px' }}
                                        onClick={() => {
                                            runtime.openLink('https://chatboxai.app/redirect_app/manage_license')
                                        }}
                                    >
                                        {t('Retrieve License')}
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Card>
                </Box>
            </Box>

            <Box sx={{ display: onlyShow(ModelProvider.Claude) }}>
                <PasswordTextField
                    label={t('api key')}
                    value={settingsEdit.claudeApiKey}
                    setValue={(value) => {
                        setSettingsEdit({ ...settingsEdit, claudeApiKey: value })
                    }}
                />
                <ClaudeModelSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                <MaxContextMessageCountSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            </Box>
        </Box>
    )
}

export function TokenConfig(props: ModelConfigProps) {
    const { t } = useTranslation()

    const { settingsEdit, setSettingsEdit } = props

    const { maxTokenLimit, minTokenLimit, maxContextTokenLimit, minContextTokenLimit, totalTokenLimit } =
        getTokenLimits(settingsEdit)

    const sliderChangeHandler = (key: 'openaiMaxTokens' | 'openaiMaxContextTokens', max: number, min: number) => {
        return (event: Event, newValue: number | number[], activeThumb: number) => {
            if (Array.isArray(newValue)) {
                newValue = newValue[0]
            }
            newValue = Math.floor(newValue)
            if (newValue > max) {
                newValue = max
            }
            if (newValue < min) {
                newValue = min
            }
            const otherKey = key === 'openaiMaxTokens' ? 'openaiMaxContextTokens' : 'openaiMaxTokens'
            if (newValue + settingsEdit[otherKey] > totalTokenLimit) {
                settingsEdit[otherKey] = totalTokenLimit - newValue
            }
            settingsEdit[key] = newValue
            setSettingsEdit({ ...settingsEdit })
        }
    }
    const inputChangeHandler = (key: 'openaiMaxTokens' | 'openaiMaxContextTokens', max: number, min: number) => {
        return (event: React.ChangeEvent<HTMLInputElement>) => {
            const raw = event.target.value
            let newValue = parseInt(raw)
            if (isNaN(newValue)) {
                return
            }
            newValue = Math.floor(newValue)
            if (newValue > max) {
                newValue = max
            }
            if (newValue < min) {
                newValue = min
            }
            const otherKey = key === 'openaiMaxTokens' ? 'openaiMaxContextTokens' : 'openaiMaxTokens'
            if (newValue + settingsEdit[otherKey] > totalTokenLimit) {
                settingsEdit[otherKey] = totalTokenLimit - newValue
            }
            settingsEdit[key] = newValue
            setSettingsEdit({ ...settingsEdit })
        }
    }
    return (
        <Box sx={{ margin: '10px' }}>
            <Box>
                <Typography id="discrete-slider" gutterBottom>
                    {t('max tokens in context')}
                </Typography>
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                }}
            >
                <Box sx={{ width: '92%' }}>
                    <Slider
                        value={settingsEdit.openaiMaxContextTokens}
                        onChange={sliderChangeHandler(
                            'openaiMaxContextTokens',
                            maxContextTokenLimit,
                            minContextTokenLimit
                        )}
                        aria-labelledby="discrete-slider"
                        valueLabelDisplay="auto"
                        step={64}
                        min={minContextTokenLimit}
                        max={maxContextTokenLimit}
                    />
                </Box>
                <TextField
                    sx={{ marginLeft: 2, width: '100px' }}
                    value={settingsEdit.openaiMaxContextTokens}
                    onChange={inputChangeHandler('openaiMaxContextTokens', maxContextTokenLimit, minContextTokenLimit)}
                    type="text"
                    size="small"
                    variant="outlined"
                />
            </Box>
            <Box sx={{ marginTop: 3, marginBottom: -1 }}>
                <Typography id="discrete-slider" gutterBottom>
                    {t('max tokens to generate')}
                </Typography>
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                }}
            >
                <Box sx={{ width: '92%' }}>
                    <Slider
                        value={settingsEdit.openaiMaxTokens}
                        onChange={sliderChangeHandler('openaiMaxTokens', maxTokenLimit, minTokenLimit)}
                        aria-labelledby="discrete-slider"
                        valueLabelDisplay="auto"
                        step={64}
                        min={minTokenLimit}
                        max={maxTokenLimit}
                    />
                </Box>
                {settingsEdit.openaiMaxTokens === 0 ? (
                    <Box sx={{ marginLeft: 2, width: '100px' }}>
                        <span style={{ padding: '5px' }}>{t('Auto')}</span>
                    </Box>
                ) : (
                    <TextField
                        sx={{ marginLeft: 2, width: '100px' }}
                        value={settingsEdit.openaiMaxTokens}
                        onChange={inputChangeHandler('openaiMaxTokens', maxTokenLimit, minTokenLimit)}
                        type="text"
                        size="small"
                        variant="outlined"
                    />
                )}
            </Box>
        </Box>
    )
}

export function wrapDefaultTokenConfigUpdate(settings: ModelSettings): ModelSettings {
    switch (settings.aiProvider) {
        case ModelProvider.OpenAI:
            const limits = getTokenLimits(settings)
            settings.openaiMaxTokens = limits.minTokenLimit // 默认最小值
            settings.openaiMaxContextTokens = limits.maxContextTokenLimit // 默认最大值
            if (settings.model.startsWith('gpt-4')) {
                settings.openaiMaxContextMessageCount = 6
            } else {
                settings.openaiMaxContextMessageCount = 999
            }
            break
        case ModelProvider.Azure:
            settings.openaiMaxTokens = defaults.settings().openaiMaxTokens
            settings.openaiMaxContextTokens = defaults.settings().openaiMaxContextTokens
            settings.openaiMaxContextMessageCount = 8
            break
        case ModelProvider.ChatboxAI:
            settings.openaiMaxTokens = 0
            settings.openaiMaxContextTokens = 8000
            settings.openaiMaxContextMessageCount = 8
            break
        case ModelProvider.ChatGLM6B:
            settings.openaiMaxTokens = 0
            settings.openaiMaxContextTokens = 2000
            settings.openaiMaxContextMessageCount = 4
            break
        case ModelProvider.Claude:
            settings.openaiMaxContextMessageCount = 10
            break
        default:
            break
    }
    return { ...settings }
}

/**
 * 根据设置获取模型的 maxTokens、maxContextTokens 的取值范围
 * @param settings
 * @returns
 */
function getTokenLimits(settings: ModelSettings) {
    const totalTokenLimit =
        settings.aiProvider === ModelProvider.OpenAI
            ? modelConfigs[settings.model]?.maxTokens || 4000 // 旧版本用户可能依然使用 modelConfigs 中弃用删除的模型，需要兼容 undefined 情况
            : 32 * 1000
    const maxContextTokenLimit = Math.floor(totalTokenLimit / 1000) * 1000
    const minContextTokenLimit = 256
    const maxTokenLimit = totalTokenLimit - minContextTokenLimit
    const minTokenLimit = 0
    return {
        maxTokenLimit,
        minTokenLimit,
        maxContextTokenLimit,
        minContextTokenLimit,
        totalTokenLimit,
    }
}

export function AiProviderSelect(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const theme = useTheme()
    return (
        <FormControl fullWidth variant="outlined" margin="dense">
            <InputLabel htmlFor="ai-provider-select">{t('AI Model Provider')}</InputLabel>
            <Select
                label={t('AI Model Provider')}
                id="ai-provider-select"
                value={settingsEdit.aiProvider}
                sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[100],
                }}
                onChange={(e) => {
                    setSettingsEdit(
                        wrapDefaultTokenConfigUpdate({
                            ...settingsEdit,
                            aiProvider: e.target.value as ModelProvider,
                        })
                    )
                }}
            >
                {aiModelProviderList.map((provider) => (
                    <MenuItem key={provider.value} value={provider.value} disabled={provider.disabled}>
                        {provider.label}
                        {provider.disabled ? ` (${t('Coming soon')})` : ''}
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
                ))}
            </Select>
        </FormControl>
    )
}

export function ModelSelect(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <FormControl fullWidth variant="outlined" margin="dense">
            <InputLabel htmlFor="model-select">{t('model')}</InputLabel>
            <Select
                label={t('model')}
                id="model-select"
                value={settingsEdit.model}
                onChange={(e) =>
                    setSettingsEdit(
                        wrapDefaultTokenConfigUpdate({
                            ...settingsEdit,
                            model: e.target.value as any,
                        })
                    )
                }
            >
                {models.map((model) => (
                    <MenuItem key={model} value={model}>
                        {model}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}

function ShortcutTab(props: ConfigProps) {
    const { t } = useTranslation()
    const [alt, setAlt] = React.useState('Alt')
    useEffect(() => {
        ;(async () => {
            const platform = await runtime.getPlatform()
            if (platform === 'darwin') {
                setAlt('Option')
            }
        })()
    }, [])
    return (
        <Box>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('Description')}</TableCell>
                            <TableCell align="center">{t('Key Combination')}</TableCell>
                            <TableCell align="center">{t('Toggle')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell component="th" scope="row">
                                {t('Show/Hide Application Window')}
                            </TableCell>
                            <TableCell align="center">
                                <Shortcut keys={[alt, '`']} />
                            </TableCell>
                            <TableCell align="center">
                                <Switch
                                    size="small"
                                    checked={!props.settingsEdit.disableQuickToggleShortcut}
                                    onChange={(e) =>
                                        props.setSettingsEdit({
                                            ...props.settingsEdit,
                                            disableQuickToggleShortcut: !e.target.checked,
                                        })
                                    }
                                />
                            </TableCell>
                        </TableRow>
                        {[
                            { description: t('Navigate to Next Conversation'), keys: ['Ctrl', 'Tab'] },
                            { description: t('Navigate to Previous Conversation'), keys: ['Ctrl', 'Shift', 'Tab'] },
                            {
                                description: t('Navigate to Specific Conversation'),
                                keys: ['Ctrl', t('any number key')],
                            },
                            { description: t('Create New Conversation'), keys: ['Ctrl', 'N'] },
                            { description: t('Focus on Input Box'), keys: ['Ctrl', 'I'] },
                            { description: t('Send'), keys: [t('Enter')] },
                            { description: t('Insert New Line in Input Box'), keys: ['Shift', t('Enter')] },
                            { description: t('Send Without Generating Response'), keys: ['Ctrl', t('Enter')] },
                        ].map((item, ix) => (
                            <TableRow key={ix}>
                                <TableCell component="th" scope="row">
                                    {item.description}
                                </TableCell>
                                <TableCell align="center">
                                    <Shortcut keys={item.keys} />
                                </TableCell>
                                <TableCell align="center">
                                    <Switch size="small" checked disabled />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}
