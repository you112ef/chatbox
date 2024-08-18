import { Select, MenuItem, FormControl, InputLabel, TextField } from '@mui/material'
import { ModelSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import { models } from '../packages/models/openai'
import CreatableSelect from '@/components/CreatableSelect'

export interface Props {
    model: ModelSettings['model'],
    openaiCustomModel: ModelSettings['openaiCustomModel'],
    openaiCustomModelOptions: ModelSettings['openaiCustomModelOptions'],
    onUpdateModel(updated: ModelSettings['model']): void
    onUpdateOpenaiCustomModel(updated: ModelSettings['openaiCustomModel']): void
    onUpdateOpenaiCustomModelOptions(updated: ModelSettings['openaiCustomModelOptions']): void
    className?: string
}

export default function OpenAIModelSelect(props: Props) {
    const { model, openaiCustomModel, openaiCustomModelOptions, onUpdateModel, onUpdateOpenaiCustomModel, onUpdateOpenaiCustomModelOptions, className } = props
    const { t } = useTranslation()
    return (
        <FormControl fullWidth variant="outlined" margin="dense" className={className}>
            <InputLabel htmlFor="model-select">{t('model')}</InputLabel>
            <Select
                label={t('model')}
                id="model-select"
                value={model}
                onChange={(e) => onUpdateModel(e.target.value as ModelSettings['model'])}
            >
                {models.map((model) => (
                    <MenuItem key={model} value={model}>
                        {model}
                    </MenuItem>
                ))}
                <MenuItem key="custom-model" value={'custom-model'}>
                    {t('Custom Model')}
                </MenuItem>
            </Select>
            {props.model === 'custom-model' && (
                <CreatableSelect
                    label={t('Custom Model Name')}
                    value={openaiCustomModel || ''}
                    options={openaiCustomModelOptions}
                    onChangeValue={(updated) => onUpdateOpenaiCustomModel(updated)}
                    onUpdateOptions={(updated) => onUpdateOpenaiCustomModelOptions(updated)}
                />
            )}
        </FormControl>
    )
}
