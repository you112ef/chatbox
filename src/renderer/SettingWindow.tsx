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
} from '@mui/material'
import { Settings, ModelProvider, ThemeMode, aiProviderNameHash } from './types'
import ThemeChangeButton from './theme/ThemeChangeIcon'
import { styled } from '@mui/material/styles'
import MuiAccordionDetails from '@mui/material/AccordionDetails'
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion'
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary'
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp'
import { Trans, useTranslation } from 'react-i18next'
import PlaylistAddCheckCircleIcon from '@mui/icons-material/PlaylistAddCheckCircle'
import LightbulbCircleIcon from '@mui/icons-material/LightbulbCircle'
import * as env from './env'
import * as defaults from './stores/defaults'
import { useAtom } from 'jotai'
import { settingsAtom } from './stores/atoms'
import * as toastActions from './stores/toastActions'
import { switchTheme } from './hooks/useThemeSwitcher'
import * as api from './api'
import { usePremium } from './hooks/usePremium'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { models, languageNameMap, languages, modelConfigs } from './config'

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
                                <MenuItem key="chatbox-ai" value={ModelProvider.ChatboxAI}>
                                    {aiProviderNameHash[ModelProvider.ChatboxAI]}
                                    <Chip
                                        label={t('Easy Access')}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                        sx={{ marginLeft: '10px' }}
                                    />
                                </MenuItem>
                                <MenuItem key="openai" value={ModelProvider.OpenAI}>
                                    {aiProviderNameHash[ModelProvider.OpenAI]}
                                </MenuItem>
                                <MenuItem key="azure" value={ModelProvider.Azure}>
                                    {aiProviderNameHash[ModelProvider.Azure]}
                                </MenuItem>
                                <MenuItem key="chatglm" value={ModelProvider.ChatGLM6B}>
                                    {aiProviderNameHash[ModelProvider.ChatGLM6B]}
                                </MenuItem>
                                <MenuItem key="claude" value="claude" disabled>
                                    Claude API ({t('Coming soon')})
                                </MenuItem>
                                <MenuItem key="hunyuan" value="hunyuan" disabled>
                                    腾讯混元 ({t('Coming soon')})
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <ModelConfig settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
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

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(
    ({ theme }) => ({
        border: `1px solid ${theme.palette.divider}`,
        '&:not(:last-child)': {
            // borderBottom: 0,
        },
        '&:before': {
            display: 'none',
        },
    })
)

const AccordionSummary = styled((props: AccordionSummaryProps) => (
    <MuiAccordionSummary expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />} {...props} />
))(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : 'rgba(0, 0, 0, .03)',
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
        transform: 'rotate(90deg)',
    },
    '& .MuiAccordionSummary-content': {
        marginLeft: theme.spacing(1),
    },
}))

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: theme.spacing(2),
    border: '1px solid rgba(0, 0, 0, .125)',
}))

function ModelConfig(props: { settingsEdit: Settings; setSettingsEdit: (settings: Settings) => void }) {
    const { t } = useTranslation()
    const premium = usePremium()

    const { settingsEdit, setSettingsEdit } = props

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
    const onlyShow = (provider: ModelProvider) => {
        return settingsEdit.aiProvider === provider ? 'block' : 'none'
    }
    return (
        <Box>
            <Divider sx={{ margin: '12px 0' }} />
            <Box sx={{ display: onlyShow(ModelProvider.OpenAI) }}>
                <TextField
                    autoFocus
                    margin="dense"
                    label={t('openai api key')}
                    type="password"
                    fullWidth
                    variant="outlined"
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={settingsEdit.openaiKey}
                    onChange={(e) =>
                        setSettingsEdit({
                            ...settingsEdit,
                            openaiKey: e.target.value.trim(),
                        })
                    }
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
                                                <Chip
                                                    size="small"
                                                    icon={<PlaylistAddCheckCircleIcon />}
                                                    label={t('meticulous')}
                                                />
                                            ),
                                        },
                                        {
                                            value: 0.8,
                                            label: (
                                                <Chip
                                                    size="small"
                                                    icon={<LightbulbCircleIcon />}
                                                    label={t('creative')}
                                                />
                                            ),
                                        },
                                    ]}
                                />
                            </Box>
                        </Box>

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
                <TextField
                    autoFocus
                    margin="dense"
                    label={t('Azure API Key')}
                    type="password"
                    fullWidth
                    variant="outlined"
                    value={settingsEdit.azureApikey}
                    onChange={(e) =>
                        setSettingsEdit({
                            ...settingsEdit,
                            azureApikey: e.target.value.trim(),
                        })
                    }
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
                                                <Chip
                                                    size="small"
                                                    icon={<PlaylistAddCheckCircleIcon />}
                                                    label={t('meticulous')}
                                                />
                                            ),
                                        },
                                        {
                                            value: 0.8,
                                            label: (
                                                <Chip
                                                    size="small"
                                                    icon={<LightbulbCircleIcon />}
                                                    label={t('creative')}
                                                />
                                            ),
                                        },
                                    ]}
                                />
                            </Box>
                        </Box>

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
                    <TextField
                        autoFocus
                        margin="dense"
                        label={t('Chatbox AI License')}
                        type="password"
                        fullWidth
                        variant="outlined"
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                        value={settingsEdit.licenseKey || ''}
                        disabled={premium.premiumActivated || premium.premiumIsLoading}
                        helperText={
                            <span style={{ color: 'green' }}>
                                {premium.premiumActivated ? t('License Activated') : ''}
                            </span>
                        }
                        onChange={(e) =>
                            setSettingsEdit({
                                ...settingsEdit,
                                licenseKey: e.target.value.trim(),
                            })
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

function TokenConfig(props: { settingsEdit: Settings; setSettingsEdit: (settings: Settings) => void }) {
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

function wrapDefaultTokenConfigUpdate(settings: Settings): Settings {
    // 自动更新模型的token设置
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
function getTokenLimits(settings: Settings) {
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
