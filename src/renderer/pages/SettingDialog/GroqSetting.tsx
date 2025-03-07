import GropModelSelect from '@/components/GroqModelSelect'
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'
import PasswordTextField from '@/components/PasswordTextField'
import TemperatureSlider from '@/components/TemperatureSlider'
import { Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ModelSettings } from '../../../shared/types'
import { Accordion, AccordionDetails, AccordionSummary } from '../../components/Accordion'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function GroqSetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <Stack spacing={2}>
            <PasswordTextField
                label={t('api key')}
                value={settingsEdit.groqAPIKey}
                setValue={(value) => {
                    setSettingsEdit({ ...settingsEdit, groqAPIKey: value })
                }}
            />
            <GropModelSelect
                value={settingsEdit.groqModel}
                onChange={(value) => setSettingsEdit({ ...settingsEdit, groqModel: value })}
            />
            <Accordion>
                <AccordionSummary aria-controls="panel1a-content">
                    <Typography>{t('Advanced')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <MaxContextMessageCountSlider
                        value={settingsEdit.openaiMaxContextMessageCount}
                        onChange={(v) => setSettingsEdit({ ...settingsEdit, openaiMaxContextMessageCount: v })}
                    />
                    <TemperatureSlider
                        value={settingsEdit.temperature}
                        onChange={(v) => setSettingsEdit({ ...settingsEdit, temperature: v })}
                    />
                </AccordionDetails>
            </Accordion>
        </Stack>
    )
}
