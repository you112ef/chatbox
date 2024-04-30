import { Chip, Select, MenuItem, FormControl, InputLabel, useTheme } from '@mui/material'
import { ModelProvider } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import { AIModelProviderMenuOptionList } from '../packages/models'

interface ModelConfigProps {
    value: ModelProvider
    onChange(value: ModelProvider): void
    className?: string
}

export default function AIProviderSelect(props: ModelConfigProps) {
    const { t } = useTranslation()
    const theme = useTheme()
    return (
        <FormControl fullWidth variant="outlined" margin="dense" className={props.className}>
            <InputLabel htmlFor="ai-provider-select">{t('AI Model Provider')}</InputLabel>
            <Select
                label={t('AI Model Provider')}
                id="ai-provider-select"
                value={props.value}
                sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[100],
                }}
                onChange={(e) => props.onChange(e.target.value as ModelProvider)}
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
