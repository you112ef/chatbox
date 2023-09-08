import { Divider, Box } from '@mui/material'
import { ModelProvider, ModelSettings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import OpenAISetting from './OpenAISetting'
import AzureSetting from './AzureSetting'
import ChatboxAISetting from './ChatboxAISetting'
import ClaudeSetting from './ClaudeSetting'
import ChatGLM6BSetting from './ChatGLMSetting'
import AIProviderSelect from '../../components/AIProviderSelect'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function ModelSettingTab(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <Box>
            <AIProviderSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
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
        </Box>
    )
}
