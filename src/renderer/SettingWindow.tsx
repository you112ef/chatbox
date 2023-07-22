import React from 'react'
import {
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
    InputAdornment,
    IconButton,
} from '@mui/material'
import { Settings, ModelProvider, ThemeMode, ModelSettings } from './types'
import ThemeChangeButton from './theme/ThemeChangeIcon'
import { Trans, useTranslation } from 'react-i18next'
import PlaylistAddCheckCircleIcon from '@mui/icons-material/PlaylistAddCheckCircle'
import LightbulbCircleIcon from '@mui/icons-material/LightbulbCircle'
import * as env from './env'
import * as defaults from './stores/defaults'
import { useAtom } from 'jotai'
import { settingsAtom } from './stores/atoms'
import { switchTheme } from './hooks/useThemeSwitcher'
import * as api from './api'
import { usePremium } from './hooks/usePremium'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { models, languageNameMap, languages, modelConfigs, aiModelProviderList } from './config'
import { Accordion, AccordionSummary, AccordionDetails } from './components/Accordion'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

const { useEffect } = React

type Tab = 'ai' | 'display' | 'chat'

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
                    <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)}>
                        <Tab label={t('ai')} value="ai" />
                        <Tab label={t('display')} value="display" />
                        <Tab label={t('chat')} value="chat" />
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
                            <InputLabel htmlFor="language-select">{t('language')}</InputLabel>
                            <Select
                                label="language"
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
                                label="FontSize"
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
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{t('cancel')}</Button>
                <Button onClick={onSave}>{t('save')}</Button>
            </DialogActions>
        </Dialog>
    )
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
                            {env.isWeb && (
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
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        api.openLink('https://app.lemonsqueezy.com/my-orders')
                                    }}
                                >
                                    {t('Manage License and Devices')}
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            api.openLink(
                                                'https://benn.lemonsqueezy.com/checkout/buy/4ef6934d-ad7d-4dcc-86a2-4c09ff3e7132?logo=0&discount=0'
                                            )
                                        }}
                                    >
                                        {t('Get License')}
                                    </Button>
                                    <Button
                                        variant="text"
                                        sx={{ marginLeft: '10px' }}
                                        onClick={() => {
                                            api.openLink('https://app.lemonsqueezy.com/my-orders')
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
        <Box>
            <Box sx={{ marginTop: 3, marginBottom: -1 }}>
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
    if (settings.aiProvider === ModelProvider.OpenAI) {
        const limits = getTokenLimits(settings)
        settings.openaiMaxTokens = limits.minTokenLimit // 默认最小值
        settings.openaiMaxContextTokens = limits.maxContextTokenLimit // 默认最大值
    } else if (settings.aiProvider === ModelProvider.Azure) {
        settings.openaiMaxTokens = defaults.settings().openaiMaxTokens
        settings.openaiMaxContextTokens = defaults.settings().openaiMaxContextTokens
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
    return (
        <FormControl fullWidth variant="outlined" margin="dense">
            <InputLabel htmlFor="ai-provider-select">{t('AI Provider')}</InputLabel>
            <Select
                label="ai-provider"
                id="ai-provider-select"
                value={settingsEdit.aiProvider}
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
                label="Model"
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

export function TemperatureSlider(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const handleTemperatureChange = (event: Event, newValue: number | number[], activeThumb: number) => {
        if (typeof newValue === 'number') {
            setSettingsEdit({ ...settingsEdit, temperature: newValue })
        } else {
            setSettingsEdit({
                ...settingsEdit,
                temperature: newValue[activeThumb],
            })
        }
    }
    return (
        <>
            <Box sx={{ marginTop: 3, marginBottom: 1 }}>
                <Typography id="discrete-slider" gutterBottom>
                    {t('temperature')}
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
                <Box sx={{ width: '100%' }}>
                    <Slider
                        value={settingsEdit.temperature}
                        onChange={handleTemperatureChange}
                        aria-labelledby="discrete-slider"
                        valueLabelDisplay="auto"
                        defaultValue={settingsEdit.temperature}
                        step={0.1}
                        min={0}
                        max={1}
                        marks={[
                            {
                                value: 0.2,
                                label: (
                                    <Chip size="small" icon={<PlaylistAddCheckCircleIcon />} label={t('meticulous')} />
                                ),
                            },
                            {
                                value: 0.8,
                                label: <Chip size="small" icon={<LightbulbCircleIcon />} label={t('creative')} />,
                            },
                        ]}
                    />
                </Box>
            </Box>
        </>
    )
}

function PasswordTextField(props: {
    label: string
    value: string
    setValue: (value: string) => void
    placeholder?: string
    disabled?: boolean
    helperText?: React.ReactNode
}) {
    const [showPassword, setShowPassword] = React.useState(false)
    const handleClickShowPassword = () => setShowPassword((show) => !show)
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
    }
    return (
        <TextField
            type={showPassword ? 'text' : 'password'}
            autoFocus
            margin="dense"
            label={props.label}
            fullWidth
            variant="outlined"
            placeholder={props.placeholder}
            disabled={props.disabled}
            value={props.value}
            onChange={(e) => props.setValue(e.target.value.trim())}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                        >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                    </InputAdornment>
                ),
            }}
            helperText={props.helperText}
        />
    )
}
