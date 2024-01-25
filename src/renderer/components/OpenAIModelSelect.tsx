import { Select, MenuItem, FormControl, InputLabel, TextField } from '@mui/material'
import { SessionSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import { models } from '../packages/models/openai'
import { useIsSmallScreen } from '@/hooks/useScreenChange'

export interface Props {
    settingsEdit: SessionSettings
    setSettingsEdit: (settings: SessionSettings) => void
}

export default function OpenAIModelSelect(props: Props) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const isSmallScreen = useIsSmallScreen()
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
                <MenuItem key="custom-model" value={'custom-model'}>
                    {t('Custom Model')}
                </MenuItem>
            </Select>
            {settingsEdit.model === 'custom-model' && (
                <TextField
                    autoFocus={!isSmallScreen}
                    margin="dense"
                    label={t('Custom Model Name')}
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={settingsEdit.openaiCustomModel || ''}
                    onChange={(e) =>
                        setSettingsEdit({
                            ...settingsEdit,
                            openaiCustomModel: e.target.value.trim(),
                        })
                    }
                />
            )}
        </FormControl>
    )
}
