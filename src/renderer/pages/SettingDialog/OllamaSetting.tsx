import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { ModelSettings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import TextFieldReset from '@/components/TextFieldReset'
import { useEffect, useState } from 'react'
import Ollama from '@/packages/models/ollama'

export function OllamaHostInput(props: {
    ollamaHost: string
    setOllamaHost: (host: string) => void
    className?: string
}) {
    const { t } = useTranslation()
    return (
        <TextFieldReset
            label={t('api host')}
            value={props.ollamaHost}
            defaultValue='http://localhost:11434'
            onValueChange={props.setOllamaHost}
            fullWidth
            className={props.className}
        />
    )
}

export function OllamaModelSelect(props: {
    ollamaModel: ModelSettings['ollamaModel']
    setOlamaModel: (model: ModelSettings['ollamaModel']) => void
    ollamaHost: string
    className?: string
}) {
    const { t } = useTranslation()
    const [models, setModels] = useState<string[]>([])
    useEffect(() => {
        const model = new Ollama({
            ollamaHost: props.ollamaHost,
            ollamaModel: props.ollamaModel,
            temperature: 0.5,
        })
        model.listModels().then((models) => {
            setModels(models)
        })
        if (props.ollamaModel && models.length > 0 && !models.includes(props.ollamaModel)) {
            props.setOlamaModel(models[0])
        }
    }, [props.ollamaHost])
    return (
        <FormControl fullWidth variant="outlined" margin="dense" className={props.className}>
            <InputLabel htmlFor="ollama-model-select">{t('model')}</InputLabel>
            <Select
                label={t('model')}
                id="ollama-model-select"
                value={props.ollamaModel}
                onChange={(e) =>
                    props.setOlamaModel(e.target.value)
                }
            >
                {models.map((model) => (
                    <MenuItem key={model} value={model}>
                        {model}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}
