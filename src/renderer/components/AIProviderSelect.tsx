import { Chip, Select, MenuItem, FormControl, InputLabel, useTheme } from '@mui/material'
import { ModelProvider, SessionSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import { AIModelProviderMenuOptionList } from '../packages/models'

interface ModelConfigProps {
    settingsEdit: SessionSettings
    setSettingsEdit: (settings: SessionSettings) => void
}

export default function AIProviderSelect(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const theme = useTheme()
    return (
        <FormControl fullWidth variant="outlined" margin="dense">
            <InputLabel htmlFor="ai-provider-select">{t('AI Model Provider')}</InputLabel>
            <Select
                label={t('AI Model Provider')}
                id="ai-provider-select"
                value={settingsEdit.aiProvider}
                sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[100],
                }}
                onChange={(e) => {
                    setSettingsEdit({
                        ...settingsEdit,
                        aiProvider: e.target.value as ModelProvider,
                    })
                }}
            >
                {AIModelProviderMenuOptionList.map((provider) => (
                    <MenuItem key={provider.value} value={provider.value} disabled={provider.disabled}>
                        {provider.label}
                        {provider.disabled ? ` (${t('Coming soon')})` : ''}
                        {provider.featured && (
                            <Chip
                                label={t('Easy Access')}
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ marginLeft: '10px' }}
                            />
                        )}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}
