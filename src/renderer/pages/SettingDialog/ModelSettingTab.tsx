import { Divider, Box } from '@mui/material'
import { ModelProvider, ModelSettings } from '../../../shared/types'
import OpenAISetting from './OpenAISetting'
import AzureSetting from './AzureSetting'
import ChatboxAISetting from './ChatboxAISetting'
import ClaudeSetting from './ClaudeSetting'
import ChatGLM6BSetting from './ChatGLMSetting'
import AIProviderSelect from '../../components/AIProviderSelect'
import GeminiSetting from './GeminiSetting'
import OllamaSetting from './OllamaSetting'
import GroqSetting from './GroqSetting'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function ModelSettingTab(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    return (
        <Box>
            <AIProviderSelect
                settingsEdit={settingsEdit}
                setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
            />
            <Divider sx={{ margin: '12px 0' }} />
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
                <OllamaSetting settingsEdit={settingsEdit} setSettingsEdit={(updated) => {
                    setSettingsEdit({ ...settingsEdit, ...updated })
                }} />
            )}
        </Box>
    )
}
