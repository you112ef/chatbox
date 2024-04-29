import React, { useEffect } from 'react'
import {
    Switch,
    Divider,
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    DialogContentText,
    TextField,
} from '@mui/material'
import {
    Session,
    ModelProvider,
    SessionSettings,
    settings2SessionSettings,
    isChatSession,
    isPictureSession,
    createMessage,
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
// import { resetTokenConfig } from '../packages/token_config'
import AIProviderSelect from '../components/AIProviderSelect'
import OpenAIModelSelect from '../components/OpenAIModelSelect'
// import TokenConfig from './SettingDialog/TokenConfig'
import FormControlLabel from '@mui/material/FormControlLabel'
import ImageCountSlider from '@/components/ImageCountSlider'
import ImageStyleSelect from '@/components/ImageStyleSelect'
import OllamaSetting from './SettingDialog/OllamaSetting'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import { trackingEvent } from '@/packages/event'
import GeminiModelSelect from '@/components/GeminiModelSelect'
import GropModelSelect from '@/components/GroqModelSelect'

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
                <TextField
                    margin="dense"
                    label={t('Instruction (System Prompt)')}
                    placeholder={t('Copilot Prompt Demo') || ''}
                    fullWidth
                    variant="outlined"
                    multiline
                    minRows={4}
                    maxRows={10}
                    value={systemPrompt}
                    onChange={(event) => setSystemPrompt(event.target.value)}
                />
                {isChatSession(chatConfigDialogSession) && <ChatConfig dataEdit={editingData} setDataEdit={setEditingData} />}
                {isPictureSession(chatConfigDialogSession) && <PictureConfig dataEdit={editingData} setDataEdit={setEditingData} />}
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
    const settings = useAtomValue(atoms.settingsAtom)
    const licenseDetail = useAtomValue(atoms.licenseDetailAtom)
    const settingsEdit = dataEdit.settings
    const setSettingsEdit = (updated: SessionSettings) => {
        // if (settingsEdit?.aiProvider !== updated.aiProvider || settingsEdit?.model !== updated.model) {
        //     updated = resetTokenConfig(updated)
        // }
        setDataEdit({ ...dataEdit, settings: updated })
    }
    return (
        <>
            <FormControlLabel
                control={<Switch size="medium" />}
                label={t('Specific model settings')}
                checked={!!dataEdit.settings}
                onChange={(e, checked) => {
                    if (checked) {
                        dataEdit.settings = settings2SessionSettings(settings)
                    } else {
                        dataEdit.settings = undefined
                    }
                    setDataEdit({ ...dataEdit })
                }}
                sx={{ margin: '12px 0' }}
            />
            {settingsEdit && (
                <>
                    <AIProviderSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                    <Divider sx={{ margin: '16px 0' }} />
                    {settingsEdit.aiProvider === ModelProvider.ChatboxAI && (
                        <>
                            {licenseDetail && (
                                <ChatboxAIModelSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            )}
                            <MaxContextMessageCountSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                        </>
                    )}
                    {settingsEdit.aiProvider === ModelProvider.OpenAI && (
                        <>
                            <OpenAIModelSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            <MaxContextMessageCountSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            <Accordion>
                                <AccordionSummary aria-controls="panel1a-content">
                                    {t('model')} & {t('token')}
                                </AccordionSummary>
                                <AccordionDetails>
                                    {/* <TokenConfig settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} /> */}
                                    <TopPSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                </AccordionDetails>
                            </Accordion>
                        </>
                    )}
                    {settingsEdit.aiProvider === ModelProvider.Azure && (
                        <>
                            <TextField
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
                            <MaxContextMessageCountSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            <Accordion>
                                <AccordionSummary aria-controls="panel1a-content">
                                    {t('model')} & {t('token')}
                                </AccordionSummary>
                                <AccordionDetails>
                                    {/* <TokenConfig settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} /> */}
                                    <TopPSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                </AccordionDetails>
                            </Accordion>
                        </>
                    )}
                    {settingsEdit.aiProvider === ModelProvider.ChatGLM6B && (
                        <>
                            <MaxContextMessageCountSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                        </>
                    )}
                    {settingsEdit.aiProvider === ModelProvider.Claude && (
                        <>
                            <ClaudeModelSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            <MaxContextMessageCountSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                        </>
                    )}
                    {
                        settingsEdit.aiProvider === ModelProvider.Ollama && (
                            <>
                                <OllamaSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                <MaxContextMessageCountSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            </>
                        )
                    }
                    {
                        settingsEdit.aiProvider === ModelProvider.Gemini && (
                            <>
                                <GeminiModelSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                <MaxContextMessageCountSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            </>
                        )
                    }
                    {
                        settingsEdit.aiProvider === ModelProvider.Groq && (
                            <>
                                <GropModelSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                <MaxContextMessageCountSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            </>
                        )
                    }
                </>
            )}
        </>
    )
}

function PictureConfig(props: { dataEdit: Session; setDataEdit: (data: Session) => void }) {
    const { dataEdit, setDataEdit } = props
    const { t } = useTranslation()
    const settings = useAtomValue(atoms.settingsAtom)
    const settingsEdit = dataEdit.settings || settings2SessionSettings(settings)
    const setSettingsEdit = (updated: SessionSettings) => {
        setDataEdit({ ...dataEdit, settings: updated })
    }
    return (
        <div className="mt-8">
            <ImageStyleSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            <ImageCountSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
        </div>
    )
}
