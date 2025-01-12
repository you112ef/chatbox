import { ModelSettings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import Perplexity from '@/packages/models/perplexity'
import SimpleSelect from '@/components/SimpleSelect'
import { Box } from '@mui/material'
import PasswordTextField from '@/components/PasswordTextField'
import TemperatureSlider from '@/components/TemperatureSlider'
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function PerplexitySetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <Box>
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

export function PerplexityModelSelect(props: {
    perplexityModel: ModelSettings['perplexityModel']
    setPerplexityModel: (model: ModelSettings['perplexityModel']) => void
    perplexityApiKey: string
    className?: string
}) {
    const { t } = useTranslation()
    const [models, setModels] = useState<string[]>([])
    useEffect(() => {
        ; (async () => {
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
