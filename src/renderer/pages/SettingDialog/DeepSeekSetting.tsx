import { Box, Link } from '@mui/material'
import { ModelSettings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import PasswordTextField from '@/components/PasswordTextField'
import TemperatureSlider from '@/components/TemperatureSlider'
import platform from '@/platform'
import DeepSeekModelSelect from '@/components/DeepSeekModelSelect'
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function DeepSeekSetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <Box>
            <PasswordTextField
                label={t('api key')}
                value={settingsEdit.deepseekAPIKey}
                setValue={(value) => {
                    setSettingsEdit({ ...settingsEdit, deepseekAPIKey: value })
                }}
                // helperText={
                //     <Link
                //         className="cursor-pointer"
                //         onClick={() => platform.openLink('https://platform.deepseek.com/api_keys')}
                //     >
                //         {t('Get API Key')}
                //     </Link>
                // }
            />
            <DeepSeekModelSelect
                value={settingsEdit.deepseekModel}
                onChange={(value) => setSettingsEdit({ ...settingsEdit, deepseekModel: value })}
            />
            <MaxContextMessageCountSlider
                value={settingsEdit.openaiMaxContextMessageCount}
                onChange={(v) => setSettingsEdit({ ...settingsEdit, openaiMaxContextMessageCount: v })}
            />
            <TemperatureSlider
                value={settingsEdit.temperature}
                onChange={(v) => setSettingsEdit({ ...settingsEdit, temperature: v })}
            />
        </Box>
    )
}
