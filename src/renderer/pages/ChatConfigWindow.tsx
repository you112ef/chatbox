import React, { useEffect, useRef } from 'react'
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
    useTheme,
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
import DeepSeekModelSelect from '@/components/DeepSeekModelSelect'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import { trackingEvent } from '@/packages/event'
import GeminiModelSelect from '@/components/GeminiModelSelect'
import GropModelSelect from '@/components/GroqModelSelect'
import { OllamaHostInput, OllamaModelSelect } from './SettingDialog/OllamaSetting'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import EditableAvatar from '@/components/EditableAvatar'
import { v4 as uuidv4 } from 'uuid'
import { ImageInStorage, handleImageInputAndSave } from '@/components/Image'
import ImageIcon from '@mui/icons-material/Image'
import CreatableSelect from '@/components/CreatableSelect'
import { SiliconflowModelSelect } from './SettingDialog/SiliconflowSetting'
import { LMStudioModelSelect } from './SettingDialog/LMStudioSetting'

export default function ChatConfigWindow(props: {}) {
    const { t } = useTranslation()
    const isSmallScreen = useIsSmallScreen()
    const [chatConfigDialogSessionId, setChatConfigDialogSessionId] = useAtom(atoms.chatConfigDialogIdAtom)
    const globalSettings = useAtomValue(atoms.settingsAtom)
    const theme = useTheme()

    const chatConfigDialogSession = sessionActions.getSession(chatConfigDialogSessionId || '')
    const [editingData, setEditingData] = React.useState<Session | null>(chatConfigDialogSession || null)
    useEffect(() => {
        if (!chatConfigDialogSession) {
            setEditingData(null)
        } else {
            setEditingData({
                ...chatConfigDialogSession,
                settings: chatConfigDialogSession.settings ? { ...chatConfigDialogSession.settings } : undefined,
            })
        }
    }, [chatConfigDialogSessionId])

    const [systemPrompt, setSystemPrompt] = React.useState('')
    useEffect(() => {
        if (!chatConfigDialogSession) {
            setSystemPrompt('')
        } else {
            const systemMessage = chatConfigDialogSession.messages.find((m) => m.role === 'system')
            setSystemPrompt(systemMessage?.content || '')
        }
    }, [chatConfigDialogSessionId])

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
    }, [chatConfigDialogSessionId])

    const onCancel = () => {
        setChatConfigDialogSessionId(null)
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
        setChatConfigDialogSessionId(null)
    }

    if (!chatConfigDialogSession || !editingData) {
        return null
    }
    return (
        <Dialog open={!!chatConfigDialogSession} onClose={onCancel} fullWidth>
            <DialogTitle>{t('Conversation Settings')}</DialogTitle>
            <DialogContent>
                <DialogContentText></DialogContentText>
                <EditableAvatar
                    onChange={(event) => {
                        const key = `picture:assistant-avatar-${chatConfigDialogSession?.id}:${uuidv4()}`
                        handleImageInputAndSave(event, key, () =>
                            setEditingData({ ...editingData, assistantAvatarKey: key })
                        )
                    }}
                    onRemove={() => {
                        setEditingData({ ...editingData, assistantAvatarKey: undefined })
                    }}
                    removable={!!editingData.assistantAvatarKey}
                    sx={{
                        backgroundColor:
                            editingData.type === 'picture'
                                ? theme.palette.secondary.main
                                : editingData.picUrl
                                    ? theme.palette.background.default
                                    : theme.palette.primary.main,
                    }}
                >
                    {editingData.assistantAvatarKey ? (
                        <ImageInStorage
                            storageKey={editingData.assistantAvatarKey}
                            className="object-cover object-center w-full h-full"
                        />
                    ) : editingData.picUrl ? (
                        <img src={editingData.picUrl} className="object-cover object-center w-full h-full" />
                    ) : editingData.type === 'picture' ? (
                        <ImageIcon
                            fontSize="large"
                            sx={{
                                width: '60px',
                                height: '60px',
                            }}
                        />
                    ) : globalSettings.defaultAssistantAvatarKey ? (
                        <ImageInStorage
                            storageKey={globalSettings.defaultAssistantAvatarKey}
                            className="object-cover object-center w-full h-full"
                        />
                    ) : (
                        <SmartToyIcon fontSize="large" />
                    )}
                </EditableAvatar>
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
                <div className="mt-1">
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
                <Accordion defaultExpanded={!!editingData.settings} className="mt-2">
                    <AccordionSummary aria-controls="panel1a-content">
                        <div className="flex flex-row w-full justify-between items-center">
                            <Typography>{t('Specific model settings')}</Typography>
                            {editingData.settings && (
                                <Button size="small" variant="text" color="warning" onClick={onReset}>
                                    {t('Reset to Global Settings')}
                                </Button>
                            )}
                        </div>
                    </AccordionSummary>
                    <AccordionDetails>
                        {isChatSession(chatConfigDialogSession) && (
                            <ChatConfig dataEdit={editingData} setDataEdit={setEditingData} />
                        )}
                        {isPictureSession(chatConfigDialogSession) && (
                            <PictureConfig dataEdit={editingData} setDataEdit={setEditingData} />
                        )}
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
    // 全局设置
    const [globalSettings, setGlobalSettings] = useAtom(atoms.settingsAtom)
    // 会话生效设置 = 全局设置 + 会话设置
    const mergedSettings = sessionActions.mergeSettings(
        globalSettings,
        dataEdit.settings || {},
        dataEdit.type || 'chat'
    )
    // 修改当前会话设置
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

    // 当前选择的自定义提供方的全局设置
    const globalCustomProvider = globalSettings.customProviders.find(
        (provider) => provider.id === mergedSettings.selectedCustomProviderId
    )
    // 当前选择的自定义提供方的选中模型
    const sessionCustomProviderModel = (
        mergedSettings.customProviders.find((provider) => provider.id === mergedSettings.selectedCustomProviderId) ||
        globalCustomProvider
    )?.model

    return (
        <>
            <AIProviderSelect
                aiProvider={mergedSettings.aiProvider}
                onSwitchAIProvider={(v) => updateSettingsEdit({ aiProvider: v })}
                selectedCustomProviderId={mergedSettings.selectedCustomProviderId}
                onSwitchCustomProvider={(v) =>
                    updateSettingsEdit({
                        aiProvider: ModelProvider.Custom,
                        selectedCustomProviderId: v,
                    })
                }
                className={specificSettings.aiProvider === undefined ? 'opacity-50' : ''}
                hideCustomProviderManage
            />
            <Divider sx={{ margin: '16px 0' }} />
            {mergedSettings.aiProvider === ModelProvider.ChatboxAI && (
                <>
                    {licenseDetail && (
                        <ChatboxAIModelSelect
                            value={mergedSettings.chatboxAIModel}
                            onChange={(v) => updateSettingsEdit({ chatboxAIModel: v })}
                            className={specificSettings.chatboxAIModel === undefined ? 'opacity-50' : ''}
                        />
                    )}
                </>
            )}
            {mergedSettings.aiProvider === ModelProvider.OpenAI && (
                <>
                    <OpenAIModelSelect
                        model={mergedSettings.model}
                        openaiCustomModel={mergedSettings.openaiCustomModel}
                        onUpdateModel={(updated) => updateSettingsEdit({ model: updated })}
                        onUpdateOpenaiCustomModel={(updated) => updateSettingsEdit({ openaiCustomModel: updated })}
                        // 选项直接读取和修改全局设置，这样用户体验会更好
                        openaiCustomModelOptions={globalSettings.openaiCustomModelOptions}
                        onUpdateOpenaiCustomModelOptions={(updated) => {
                            setGlobalSettings((globalSettings) => ({
                                ...globalSettings,
                                openaiCustomModelOptions: updated,
                            }))
                        }}
                        className={specificSettings.model === undefined ? 'opacity-50' : ''}
                    />
                </>
            )}
            {mergedSettings.aiProvider === ModelProvider.Azure && (
                <>
                    <CreatableSelect
                        label={t('Azure Deployment Name')}
                        value={mergedSettings.azureDeploymentName}
                        onChangeValue={(v) => updateSettingsEdit({ azureDeploymentName: v })}
                        // 选项直接读取和修改全局设置，这样用户体验会更好
                        options={globalSettings.azureDeploymentNameOptions}
                        onUpdateOptions={(v) => {
                            setGlobalSettings((globalSettings) => ({
                                ...globalSettings,
                                azureDeploymentNameOptions: v,
                            }))
                        }}
                        className={specificSettings.azureDeploymentName === undefined ? 'opacity-50' : ''}
                    />
                </>
            )}
            {mergedSettings.aiProvider === ModelProvider.ChatGLM6B && (
                <>
                </>
            )}
            {mergedSettings.aiProvider === ModelProvider.Claude && (
                <>
                    <ClaudeModelSelect
                        value={mergedSettings.claudeModel}
                        onChange={(v) => updateSettingsEdit({ claudeModel: v })}
                        className={specificSettings.claudeModel === undefined ? 'opacity-50' : ''}
                    />
                </>
            )}
            {mergedSettings.aiProvider === ModelProvider.Ollama && (
                <>
                    <OllamaHostInput
                        ollamaHost={mergedSettings.ollamaHost}
                        setOllamaHost={(v) => updateSettingsEdit({ ollamaHost: v })}
                        className={specificSettings.ollamaHost === undefined ? 'opacity-50' : ''}
                    />
                    <OllamaModelSelect
                        ollamaHost={mergedSettings.ollamaHost}
                        ollamaModel={mergedSettings.ollamaModel}
                        setOlamaModel={(v) => updateSettingsEdit({ ollamaModel: v })}
                        className={specificSettings.ollamaModel === undefined ? 'opacity-50' : ''}
                    />
                </>
            )}
            {mergedSettings.aiProvider === ModelProvider.Gemini && (
                <>
                    <GeminiModelSelect
                        value={mergedSettings.geminiModel}
                        onChange={(v) => updateSettingsEdit({ geminiModel: v })}
                        className={specificSettings.geminiModel === undefined ? 'opacity-50' : ''}
                    />
                </>
            )}
            {mergedSettings.aiProvider === ModelProvider.Groq && (
                <>
                    <GropModelSelect
                        value={mergedSettings.groqModel}
                        onChange={(v) => updateSettingsEdit({ groqModel: v })}
                        className={specificSettings.groqModel === undefined ? 'opacity-50' : ''}
                    />
                </>
            )}
            {mergedSettings.aiProvider === ModelProvider.DeepSeek && (
                <>
                    <DeepSeekModelSelect
                        value={mergedSettings.deepseekModel}
                        onChange={(v) => updateSettingsEdit({ deepseekModel: v })}
                        className={specificSettings.deepseekModel === undefined ? 'opacity-50' : ''}
                    />
                </>
            )}
            {mergedSettings.aiProvider === ModelProvider.SiliconFlow && (
                <>
                    <SiliconflowModelSelect
                        siliconCloudModel={mergedSettings.siliconCloudModel}
                        setSiliconCloudModel={(v) => updateSettingsEdit({ siliconCloudModel: v })}
                        siliconCloudKey={mergedSettings.siliconCloudKey}
                        className={specificSettings.siliconCloudModel === undefined ? 'opacity-50' : ''}
                    />
                </>
            )}
            {mergedSettings.aiProvider === ModelProvider.LMStudio && (
                <>
                    <LMStudioModelSelect
                        lmStudioModel={mergedSettings.lmStudioModel}
                        setLmStudioModel={(v) => updateSettingsEdit({ lmStudioModel: v })}
                        lmStudioHost={mergedSettings.lmStudioHost}
                        className={specificSettings.lmStudioModel === undefined ? 'opacity-50' : ''}
                    />
                </>
            )}
            {mergedSettings.aiProvider === ModelProvider.Custom &&
                sessionCustomProviderModel &&
                globalCustomProvider && (
                    <>
                        <CreatableSelect
                            label={t('model')}
                            value={sessionCustomProviderModel}
                            options={globalCustomProvider.modelOptions || []}
                            onChangeValue={(v) => {
                                updateSettingsEdit({
                                    customProviders: mergedSettings.customProviders.map((provider) => {
                                        if (provider.id === mergedSettings.selectedCustomProviderId) {
                                            return { ...provider, model: v }
                                        }
                                        return provider
                                    }),
                                })
                            }}
                            onUpdateOptions={(v) => {
                                setGlobalSettings((globalSettings) => ({
                                    ...globalSettings,
                                    customProviders: globalSettings.customProviders.map((provider) => {
                                        if (provider.id === mergedSettings.selectedCustomProviderId) {
                                            return { ...provider, modelOptions: v }
                                        }
                                        return provider
                                    }),
                                }))
                            }}
                            className={specificSettings.customProviders === undefined ? 'opacity-50' : ''}
                        />
                    </>
                )}
            <MaxContextMessageCountSlider
                value={mergedSettings.openaiMaxContextMessageCount}
                onChange={(v) => updateSettingsEdit({ openaiMaxContextMessageCount: v })}
                className={specificSettings.openaiMaxContextMessageCount === undefined ? 'opacity-50' : ''}
            />
            <TemperatureSlider
                value={mergedSettings.temperature}
                onChange={(v) => updateSettingsEdit({ temperature: v })}
                className={specificSettings.temperature === undefined ? 'opacity-50' : ''}
            />
            <TopPSlider
                topP={mergedSettings.topP}
                setTopP={(v) => updateSettingsEdit({ topP: v })}
                className={specificSettings.topP === undefined ? 'opacity-50' : ''}
            />
        </>
    )
}

function PictureConfig(props: { dataEdit: Session; setDataEdit: (data: Session) => void }) {
    const { dataEdit, setDataEdit } = props
    const globalSettings = useAtomValue(atoms.settingsAtom)
    const sessionSettings = sessionActions.mergeSettings(
        globalSettings,
        dataEdit.settings || {},
        dataEdit.type || 'chat'
    )
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
