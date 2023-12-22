import { Box, Link } from '@mui/material'
import { ModelSettings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import PasswordTextField from '@/components/PasswordTextField'
import TemperatureSlider from '@/components/TemperatureSlider'
import * as runtime from '@/packages/runtime'

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
                        onClick={() =>  runtime.openLink('https://makersuite.google.com/')}
                    >
                        {t('Get API key in Google AI Studio')}
                    </Link>
                }
            />
            <TemperatureSlider
                settingsEdit={settingsEdit}
                setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
            />
        </Box>
    )
}
