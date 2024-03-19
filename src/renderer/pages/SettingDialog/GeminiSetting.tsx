import { Box, Link } from '@mui/material'
import { ModelSettings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import PasswordTextField from '@/components/PasswordTextField'
import TemperatureSlider from '@/components/TemperatureSlider'
import platform from '@/platform'
import TextFieldReset from "@/components/TextFieldReset";

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function GeminiSetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <Box>
            <PasswordTextField
                label={t('api key')}
                value={settingsEdit.geminiAPIKey}
                setValue={(value) => {
                    setSettingsEdit({ ...settingsEdit, geminiAPIKey: value })
                }}
                helperText={
                    <Link
                        className="cursor-pointer" 
                        onClick={() =>  platform.openLink('https://makersuite.google.com/')}
                    >
                        {t('Get API key in Google AI Studio')}
                    </Link>
                }
            />
            <TextFieldReset
                margin="dense"
                label={t('api host')}
                type="text"
                fullWidth
                variant="outlined"
                value={settingsEdit.geminiAPIHost}
                placeholder="https://generativelanguage.googleapis.com"
                defaultValue='https://generativelanguage.googleapis.com'
                onValueChange={(value) => {
                    value = value.trim()
                    if (value.length > 4 && !value.startsWith('http')) {
                        value = 'https://' + value
                    }
                    setSettingsEdit({ ...settingsEdit, geminiAPIHost: value })
                }}
            />
            <TemperatureSlider
                settingsEdit={settingsEdit}
                setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
            />
        </Box>
    )
}
