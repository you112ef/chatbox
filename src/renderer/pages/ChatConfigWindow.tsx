import React, { useEffect } from 'react'
import {
    Divider,
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    DialogContentText,
    TextField,
    Typography,
} from '@mui/material'
import {
    Session,
    ModelProvider,
    isChatSession,
    isPictureSession,
    createMessage,
    ModelSettings,
} from '../../shared/types'
import { useTranslation } from 'react-i18next'
import * as sessionActions from '../stores/sessionActions'
import TemperatureSlider from '../components/TemperatureSlider'
import TopPSlider from '../components/TopPSlider'
import MaxContextMessageCountSlider from '../components/MaxContextMessageCountSlider'
import * as atoms from '../stores/atoms'
import { useAtomValue, useAtom } from 'jotai'
import { Accordion, AccordionSummary, AccordionDetails } from '../components/Accordion'
import ClaudeModelSelect from '../components/ClaudeModelSelect'
import ChatboxAIModelSelect from '../components/ChatboxAIModelSelect'
import AIProviderSelect from '../components/AIProviderSelect'
import OpenAIModelSelect from '../components/OpenAIModelSelect'
import ImageCountSlider from '@/components/ImageCountSlider'
import ImageStyleSelect from '@/components/ImageStyleSelect'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import { trackingEvent } from '@/packages/event'
import GeminiModelSelect from '@/components/GeminiModelSelect'
import GropModelSelect from '@/components/GroqModelSelect'
import { OllamaHostInput, OllamaModelSelect } from './SettingDialog/OllamaSetting'

interface Props {
}

export default function ChatConfigWindow(props: Props) {
    const { t } = useTranslation()
    const isSmallScreen = useIsSmallScreen()
    const [chatConfigDialogSession, setChatConfigDialogSession] = useAtom(atoms.chatConfigDialogAtom)

    const [editingData, setEditingData] = React.useState<Session | null>(chatConfigDialogSession)
    useEffect(() => {
        if (!chatConfigDialogSession) {
            setEditingData(null)
        } else {
            setEditingData({
                ...chatConfigDialogSession,
                settings: chatConfigDialogSession.settings
                    ? { ...chatConfigDialogSession.settings }
                    : undefined,
            })
        }
    }, [chatConfigDialogSession])

    const [systemPrompt, setSystemPrompt] = React.useState('')
    useEffect(() => {
        if (!chatConfigDialogSession) {
            setSystemPrompt('')
        } else {
            const systemMessage = chatConfigDialogSession.messages.find((m) => m.role === 'system')
            setSystemPrompt(systemMessage?.content || '')
        }
    }, [chatConfigDialogSession])

    const onReset = (event: React.MouseEvent) => {
        event.stopPropagation()
        event.preventDefault()
        if (chatConfigDialogSession) {
            setEditingData({
                ...chatConfigDialogSession,
                settings: undefined,
            })
        }
    }

    useEffect(() => {
        if (chatConfigDialogSession) {
            trackingEvent('chat_config_window', { event_category: 'screen_view' })
        }
    }, [chatConfigDialogSession])

    const onCancel = () => {
        setChatConfigDialogSession(null)
        setEditingData(null)
    }
    const onSave = () => {
        if (!chatConfigDialogSession || !editingData) {
            return
        }
        if (editingData.name === '') {
            editingData.name = chatConfigDialogSession.name
        }
        editingData.name = editingData.name.trim()
        if (systemPrompt === '') {
            editingData.messages = editingData.messages.filter((m) => m.role !== 'system')
        } else {
            const systemMessage = editingData.messages.find((m) => m.role === 'system')
            if (systemMessage) {
                systemMessage.content = systemPrompt.trim()
            } else {
                editingData.messages.unshift(createMessage('system', systemPrompt.trim()))
            }
        }
        sessionActions.modify(editingData)
        setChatConfigDialogSession(null)
    }

    if (!chatConfigDialogSession || !editingData) {
        return null
    }
    return (
        <Dialog open={!!chatConfigDialogSession} onClose={onCancel} fullWidth>
            <DialogTitle>{t('Conversation Settings')}</DialogTitle>
            <DialogContent>
                <DialogContentText></DialogContentText>
                <TextField
                    autoFocus={!isSmallScreen}
                    margin="dense"
                    label={t('name')}
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={editingData.name}
                    onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                />
                <div className='mt-1'>
                    <TextField
                        margin="dense"
                        label={t('Instruction (System Prompt)')}
                        placeholder={t('Copilot Prompt Demo') || ''}
                        fullWidth
                        variant="outlined"
                        multiline
                        minRows={2}
                        maxRows={8}
                        value={systemPrompt}
                        onChange={(event) => setSystemPrompt(event.target.value)}
                    />
                </div>
                <Accordion defaultExpanded={!!editingData.settings} className='mt-2'>
                    <AccordionSummary aria-controls="panel1a-content">
                        <div className='flex flex-row w-full justify-between items-center'>
                            <Typography>
                                {t('Specific model settings')}
                            </Typography>
                            {
                                editingData.settings && (
                                    <Button size='small' variant='text' color='warning' onClick={onReset}>
                                        {t('Reset to Global Settings')}
                                    </Button>
                                )
                            }
                        </div>
                    </AccordionSummary>
                    <AccordionDetails>
                        {isChatSession(chatConfigDialogSession) && <ChatConfig dataEdit={editingData} setDataEdit={setEditingData} />}
                        {isPictureSession(chatConfigDialogSession) && <PictureConfig dataEdit={editingData} setDataEdit={setEditingData} />}
                    </AccordionDetails>
                </Accordion>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{t('cancel')}</Button>
                <Button onClick={onSave}>{t('save')}</Button>
            </DialogActions>
        </Dialog>
    )
}

function ChatConfig(props: { dataEdit: Session; setDataEdit: (data: Session) => void }) {
    const { dataEdit, setDataEdit } = props
    const { t } = useTranslation()
    const licenseDetail = useAtomValue(atoms.licenseDetailAtom)
    const globalSettings = useAtomValue(atoms.settingsAtom)
    const sessionSettings = sessionActions.mergeSettings(globalSettings, dataEdit.settings || {}, dataEdit.type || 'chat')
    const updateSettingsEdit = (updated: Partial<ModelSettings>) => {
        setDataEdit({
            ...dataEdit,
            settings: {
                ...(dataEdit.settings || {}),
                ...updated,
            },
        })
    }
    const specificSettings = dataEdit.settings || {}
    return (
        <>
            <AIProviderSelect
                settings={sessionSettings}
                setSettings={updateSettingsEdit}
                className={specificSettings.aiProvider === undefined ? 'opacity-50' : ''}
                hideCustomProviderManage
            />
            <Divider sx={{ margin: '16px 0' }} />
            {sessionSettings.aiProvider === ModelProvider.ChatboxAI && (
                <>
                    {licenseDetail && (
                        <ChatboxAIModelSelect
                            value={sessionSettings.chatboxAIModel}
                            onChange={(v) => updateSettingsEdit({ chatboxAIModel: v })}
                            className={specificSettings.chatboxAIModel === undefined ? 'opacity-50' : ''}
                        />
                    )}
                    <MaxContextMessageCountSlider
                        value={sessionSettings.openaiMaxContextMessageCount}
                        onChange={(v) => updateSettingsEdit({ openaiMaxContextMessageCount: v })}
                        className={specificSettings.openaiMaxContextMessageCount === undefined ? 'opacity-50' : ''}
                    />
                    <TemperatureSlider
                        value={sessionSettings.temperature}
                        onChange={(v) => updateSettingsEdit({ temperature: v })}
                        className={specificSettings.temperature === undefined ? 'opacity-50' : ''}
                    />
                </>
            )}
            {sessionSettings.aiProvider === ModelProvider.OpenAI && (
                <>
                    <OpenAIModelSelect
                        model={sessionSettings.model}
                        openaiCustomModel={sessionSettings.openaiCustomModel}
                        onChange={(model, openaiCustomModel) => updateSettingsEdit({ model, openaiCustomModel })}
                        className={specificSettings.model === undefined ? 'opacity-50' : ''}
                    />
                    <MaxContextMessageCountSlider
                        value={sessionSettings.openaiMaxContextMessageCount}
                        onChange={(v) => updateSettingsEdit({ openaiMaxContextMessageCount: v })}
                        className={specificSettings.openaiMaxContextMessageCount === undefined ? 'opacity-50' : ''}
                    />
                    <TemperatureSlider
                        value={sessionSettings.temperature}
                        onChange={(v) => updateSettingsEdit({ temperature: v })}
                        className={specificSettings.temperature === undefined ? 'opacity-50' : ''}
                    />
                    <TopPSlider
                        topP={sessionSettings.topP}
                        setTopP={(v) => updateSettingsEdit({ topP: v })}
                        className={specificSettings.topP === undefined ? 'opacity-50' : ''}
                    />
                </>
            )}
            {sessionSettings.aiProvider === ModelProvider.Azure && (
                <>
                    <TextField
                        margin="dense"
                        label={t('Azure Deployment Name')}
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={sessionSettings.azureDeploymentName}
                        onChange={(e) =>
                            updateSettingsEdit({ azureDeploymentName: e.target.value.trim() })
                        }
                        className={specificSettings.azureDeploymentName === undefined ? 'opacity-50' : ''}
                    />
                    <MaxContextMessageCountSlider
                        value={sessionSettings.openaiMaxContextMessageCount}
                        onChange={(v) => updateSettingsEdit({ openaiMaxContextMessageCount: v })}
                        className={specificSettings.openaiMaxContextMessageCount === undefined ? 'opacity-50' : ''}
                    />
                    <TemperatureSlider
                        value={sessionSettings.temperature}
                        onChange={(v) => updateSettingsEdit({ temperature: v })}
                        className={specificSettings.temperature === undefined ? 'opacity-50' : ''}
                    />
                    <TopPSlider
                        topP={sessionSettings.topP}
                        setTopP={(v) => updateSettingsEdit({ topP: v })}
                        className={specificSettings.topP === undefined ? 'opacity-50' : ''}
                    />
                </>
            )}
            {sessionSettings.aiProvider === ModelProvider.ChatGLM6B && (
                <>
                    <MaxContextMessageCountSlider
                        value={sessionSettings.openaiMaxContextMessageCount}
                        onChange={(v) => updateSettingsEdit({ openaiMaxContextMessageCount: v })}
                        className={specificSettings.openaiMaxContextMessageCount === undefined ? 'opacity-50' : ''}
                    />
                    <TemperatureSlider
                        value={sessionSettings.temperature}
                        onChange={(v) => updateSettingsEdit({ temperature: v })}
                        className={specificSettings.temperature === undefined ? 'opacity-50' : ''}
                    />
                </>
            )}
            {sessionSettings.aiProvider === ModelProvider.Claude && (
                <>
                    <ClaudeModelSelect
                        value={sessionSettings.claudeModel}
                        onChange={(v) => updateSettingsEdit({ claudeModel: v })}
                        className={specificSettings.claudeModel === undefined ? 'opacity-50' : ''}
                    />
                    <MaxContextMessageCountSlider
                        value={sessionSettings.openaiMaxContextMessageCount}
                        onChange={(v) => updateSettingsEdit({ openaiMaxContextMessageCount: v })}
                        className={specificSettings.openaiMaxContextMessageCount === undefined ? 'opacity-50' : ''}
                    />
                    <TemperatureSlider
                        value={sessionSettings.temperature}
                        onChange={(v) => updateSettingsEdit({ temperature: v })}
                        className={specificSettings.temperature === undefined ? 'opacity-50' : ''}
                    />
                </>
            )}
            {
                sessionSettings.aiProvider === ModelProvider.Ollama && (
                    <>
                        <OllamaHostInput
                            ollamaHost={sessionSettings.ollamaHost}
                            setOllamaHost={(v) => updateSettingsEdit({ ollamaHost: v })}
                            className={specificSettings.ollamaHost === undefined ? 'opacity-50' : ''}
                        />
                        <OllamaModelSelect
                            ollamaHost={sessionSettings.ollamaHost}
                            ollamaModel={sessionSettings.ollamaModel}
                            setOlamaModel={(v) => updateSettingsEdit({ ollamaModel: v })}
                            className={specificSettings.ollamaModel === undefined ? 'opacity-50' : ''}
                        />
                        <MaxContextMessageCountSlider
                            value={sessionSettings.openaiMaxContextMessageCount}
                            onChange={(v) => updateSettingsEdit({ openaiMaxContextMessageCount: v })}
                            className={specificSettings.openaiMaxContextMessageCount === undefined ? 'opacity-50' : ''}
                        />
                        <TemperatureSlider
                            value={sessionSettings.temperature}
                            onChange={(v) => updateSettingsEdit({ temperature: v })}
                            className={specificSettings.temperature === undefined ? 'opacity-50' : ''}
                        />
                    </>
                )
            }
            {
                sessionSettings.aiProvider === ModelProvider.Gemini && (
                    <>
                        <GeminiModelSelect
                            value={sessionSettings.geminiModel}
                            onChange={(v) => updateSettingsEdit({ geminiModel: v })}
                            className={specificSettings.geminiModel === undefined ? 'opacity-50' : ''}
                        />
                        <MaxContextMessageCountSlider
                            value={sessionSettings.openaiMaxContextMessageCount}
                            onChange={(v) => updateSettingsEdit({ openaiMaxContextMessageCount: v })}
                            className={specificSettings.openaiMaxContextMessageCount === undefined ? 'opacity-50' : ''}
                        />
                        <TemperatureSlider
                            value={sessionSettings.temperature}
                            onChange={(v) => updateSettingsEdit({ temperature: v })}
                            className={specificSettings.temperature === undefined ? 'opacity-50' : ''}
                        />
                    </>
                )
            }
            {
                sessionSettings.aiProvider === ModelProvider.Groq && (
                    <>
                        <GropModelSelect
                            value={sessionSettings.groqModel}
                            onChange={(v) => updateSettingsEdit({ groqModel: v })}
                            className={specificSettings.groqModel === undefined ? 'opacity-50' : ''}
                        />
                        <MaxContextMessageCountSlider
                            value={sessionSettings.openaiMaxContextMessageCount}
                            onChange={(v) => updateSettingsEdit({ openaiMaxContextMessageCount: v })}
                            className={specificSettings.openaiMaxContextMessageCount === undefined ? 'opacity-50' : ''}
                        />
                        <TemperatureSlider
                            value={sessionSettings.temperature}
                            onChange={(v) => updateSettingsEdit({ temperature: v })}
                            className={specificSettings.temperature === undefined ? 'opacity-50' : ''}
                        />
                    </>
                )
            }
        </>
    )
}

function PictureConfig(props: { dataEdit: Session; setDataEdit: (data: Session) => void }) {
    const { dataEdit, setDataEdit } = props
    const globalSettings = useAtomValue(atoms.settingsAtom)
    const sessionSettings = sessionActions.mergeSettings(globalSettings, dataEdit.settings || {}, dataEdit.type || 'chat')
    const updateSettingsEdit = (updated: Partial<ModelSettings>) => {
        setDataEdit({
            ...dataEdit,
            settings: {
                ...(dataEdit.settings || {}),
                ...updated,
            },
        })
    }
    return (
        <div className="mt-8">
            <ImageStyleSelect
                value={sessionSettings.dalleStyle}
                onChange={(v) => updateSettingsEdit({ dalleStyle: v })}
                className={sessionSettings.dalleStyle === undefined ? 'opacity-50' : ''}
            />
            <ImageCountSlider
                value={sessionSettings.imageGenerateNum}
                onChange={(v) => updateSettingsEdit({ imageGenerateNum: v })}
                className={sessionSettings.imageGenerateNum === undefined ? 'opacity-50' : ''}
            />
        </div>
    )
}
