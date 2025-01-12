import { ModelSettings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import XAI from '@/packages/models/xai'
import SimpleSelect from '@/components/SimpleSelect'
import { Box } from '@mui/material'
import PasswordTextField from '@/components/PasswordTextField'
import TemperatureSlider from '@/components/TemperatureSlider'
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function XAISetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <Box>
            <PasswordTextField
                label={t('api key')}
                value={settingsEdit.xAIKey}
                setValue={(value) => {
                    setSettingsEdit({ ...settingsEdit, xAIKey: value })
                }}
            />
            <XAIModelSelect
                xAIModel={settingsEdit.xAIModel}
                setXAIModel={(value) => setSettingsEdit({ ...settingsEdit, xAIModel: value })}
                xAIKey={settingsEdit.xAIKey}
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

export function XAIModelSelect(props: {
    xAIModel: ModelSettings['xAIModel']
    setXAIModel: (model: ModelSettings['xAIModel']) => void
    xAIKey: string
    className?: string
}) {
    const { t } = useTranslation()
    const [models, setModels] = useState<string[]>([])
    useEffect(() => {
        ; (async () => {
            const model = new XAI({
                xAIKey: props.xAIKey,
                xAIModel: props.xAIModel,
            })
            const models = await model.listModels()
            setModels(models)
            if (props.xAIModel && models.length > 0 && !models.includes(props.xAIModel)) {
                props.setXAIModel(models[0])
            }
        })()
    }, [props.xAIKey])
    return (
        <SimpleSelect
            label={t('model')}
            value={props.xAIModel}
            options={models.map((model) => ({ value: model, label: model }))}
            onChange={(value) => props.setXAIModel(value as ModelSettings['xAIModel'])}
            className={props.className}
        />
    )
}
