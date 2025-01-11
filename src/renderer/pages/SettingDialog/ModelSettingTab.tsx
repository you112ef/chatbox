import { Divider, Box } from '@mui/material'
import { ModelProvider, ModelSettings } from '../../../shared/types'
import OpenAISetting from './OpenAISetting'
import AzureSetting from './AzureSetting'
import ChatboxAISetting from './ChatboxAISetting'
import ClaudeSetting from './ClaudeSetting'
import ChatGLM6BSetting from './ChatGLMSetting'
import AIProviderSelect from '../../components/AIProviderSelect'
import GeminiSetting from './GeminiSetting'
import GroqSetting from './GroqSetting'
import { OllamaHostInput, OllamaModelSelect } from './OllamaSetting'
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'
import TemperatureSlider from '@/components/TemperatureSlider'
import CustomProviderSetting from './CustomProviderSetting'
import DeepSeekSetting from './DeepSeekSetting'
import SiliconflowSetting from './SiliconflowSetting'
import LMStudioSetting from './LMStudioSetting'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function ModelSettingTab(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    return (
        <Box>
            <AIProviderSelect
                aiProvider={settingsEdit.aiProvider}
                onSwitchAIProvider={(v) => setSettingsEdit({ ...settingsEdit, aiProvider: v })}
                selectedCustomProviderId={settingsEdit.selectedCustomProviderId}
                onSwitchCustomProvider={(v) =>
                    setSettingsEdit({
                        ...settingsEdit,
                        aiProvider: ModelProvider.Custom,
                        selectedCustomProviderId: v,
                    })
                }
            />
            <Divider sx={{ marginTop: '10px', marginBottom: '24px' }} />
            {settingsEdit.aiProvider === ModelProvider.OpenAI && (
                <OpenAISetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.Azure && (
                <AzureSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.ChatGLM6B && (
                <ChatGLM6BSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.ChatboxAI && (
                <ChatboxAISetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.Claude && (
                <ClaudeSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.Gemini && (
                <GeminiSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.Groq && (
                <GroqSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.Ollama && (
                <>
                    <OllamaHostInput
                        ollamaHost={settingsEdit.ollamaHost}
                        setOllamaHost={(v) => setSettingsEdit({ ...settingsEdit, ollamaHost: v })}
                    />
                    <OllamaModelSelect
                        ollamaModel={settingsEdit.ollamaModel}
                        setOlamaModel={(v) => setSettingsEdit({ ...settingsEdit, ollamaModel: v })}
                        ollamaHost={settingsEdit.ollamaHost}
                    />
                    <MaxContextMessageCountSlider
                        value={settingsEdit.openaiMaxContextMessageCount}
                        onChange={(v) => setSettingsEdit({ ...settingsEdit, openaiMaxContextMessageCount: v })}
                    />
                    <TemperatureSlider
                        value={settingsEdit.temperature}
                        onChange={(v) => setSettingsEdit({ ...settingsEdit, temperature: v })}
                    />
                </>
            )}
            {settingsEdit.aiProvider === ModelProvider.DeepSeek && (
                <DeepSeekSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.Custom && (
                <CustomProviderSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.SiliconFlow && (
                <SiliconflowSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
            {settingsEdit.aiProvider === ModelProvider.LMStudio && (
                <LMStudioSetting settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
            )}
        </Box>
    )
}
