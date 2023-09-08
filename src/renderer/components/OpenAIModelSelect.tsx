import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { ModelSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import { models } from '../config'

export interface Props {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function OpenAIModelSelect(props: Props) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <FormControl fullWidth variant="outlined" margin="dense">
            <InputLabel htmlFor="model-select">{t('model')}</InputLabel>
            <Select
                label={t('model')}
                id="model-select"
                value={settingsEdit.model}
                onChange={(e) =>
                    setSettingsEdit({
                        ...settingsEdit,
                        model: e.target.value as any,
                    })
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
