import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'
import PasswordTextField from '@/components/PasswordTextField'
import SimpleSelect from '@/components/SimpleSelect'
import TemperatureSlider from '@/components/TemperatureSlider'
import Perplexity from '@/packages/models/perplexity'
import { Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModelSettings } from '../../../shared/types'
import { Accordion, AccordionDetails, AccordionSummary } from '../../components/Accordion'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function PerplexitySetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <Stack spacing={2}>
            <PasswordTextField
                label={t('api key')}
                value={settingsEdit.perplexityApiKey}
                setValue={(value) => {
                    setSettingsEdit({ ...settingsEdit, perplexityApiKey: value })
                }}
            />
            <PerplexityModelSelect
                perplexityModel={settingsEdit.perplexityModel}
                setPerplexityModel={(value) => setSettingsEdit({ ...settingsEdit, perplexityModel: value })}
                perplexityApiKey={settingsEdit.perplexityApiKey}
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

export function PerplexityModelSelect(props: {
    perplexityModel: ModelSettings['perplexityModel']
    setPerplexityModel: (model: ModelSettings['perplexityModel']) => void
    perplexityApiKey: string
    className?: string
}) {
    const { t } = useTranslation()
    const [models, setModels] = useState<string[]>([])
    useEffect(() => {
        ;(async () => {
            const model = new Perplexity({
                perplexityApiKey: props.perplexityApiKey,
                perplexityModel: props.perplexityModel,
            })
            const models = await model.listModels()
            setModels(models)
            if (props.perplexityModel && models.length > 0 && !models.includes(props.perplexityModel)) {
                props.setPerplexityModel(models[0])
            }
        })()
    }, [props.perplexityApiKey])
    return (
        <SimpleSelect
            label={t('model')}
            value={props.perplexityModel}
            options={models.map((model) => ({ value: model, label: model }))}
            onChange={(value) => props.setPerplexityModel(value as ModelSettings['perplexityModel'])}
            className={props.className}
        />
    )
}
