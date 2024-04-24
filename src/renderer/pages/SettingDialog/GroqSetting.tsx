import { Box } from '@mui/material'
import { ModelSettings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import PasswordTextField from '@/components/PasswordTextField'
import TemperatureSlider from '@/components/TemperatureSlider'
import GropModelSelect from '@/components/GroqModelSelect'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function GroqSetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <Box>
            <PasswordTextField
                label={t('api key')}
                value={settingsEdit.groqAPIKey}
                setValue={(value) => {
                    setSettingsEdit({ ...settingsEdit, groqAPIKey: value })
                }}
            />
            <GropModelSelect
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
