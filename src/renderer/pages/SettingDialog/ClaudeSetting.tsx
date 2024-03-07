import { Box } from '@mui/material'
import { ModelSettings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import TemperatureSlider from '../../components/TemperatureSlider'
import PasswordTextField from '../../components/PasswordTextField'
import MaxContextMessageCountSlider from '../../components/MaxContextMessageCountSlider'
import ClaudeModelSelect from '../../components/ClaudeModelSelect'
import TextFieldReset from '@/components/TextFieldReset'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function ClaudeSetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <Box>
            <PasswordTextField
                label={t('api key')}
                value={settingsEdit.claudeApiKey}
                setValue={(value) => {
                    setSettingsEdit({ ...settingsEdit, claudeApiKey: value })
                }}
            />
            <TextFieldReset
                margin="dense"
                label={t('api host')}
                type="text"
                fullWidth
                variant="outlined"
                value={settingsEdit.claudeApiHost}
                placeholder="https://api.anthropic.com"
                defaultValue='https://api.anthropic.com'
                onValueChange={(value) => {
                    value = value.trim()
                    if (value.length > 4 && !value.startsWith('http')) {
                        value = 'https://' + value
                    }
                    setSettingsEdit({ ...settingsEdit, claudeApiHost: value })
                }}
            />
            <ClaudeModelSelect
                settingsEdit={settingsEdit}
                setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
            />
            <MaxContextMessageCountSlider
                settingsEdit={settingsEdit}
                setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
            />
            <TemperatureSlider
                settingsEdit={settingsEdit}
                setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
            />
        </Box>
    )
}
