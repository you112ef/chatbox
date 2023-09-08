import { Button, TextField, Box } from '@mui/material'
import { Settings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import * as defaults from '../../stores/defaults'

export default function ChatSettingTab(props: {
    settingsEdit: Settings
    setSettingsEdit: (settings: Settings) => void
}) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <Box>
            <TextField
                autoFocus
                margin="dense"
                label={t('Default Prompt for New Conversation')}
                fullWidth
                variant="outlined"
                value={settingsEdit.defaultPrompt || ''}
                multiline
                maxRows={8}
                onChange={(e) =>
                    setSettingsEdit({
                        ...settingsEdit,
                        defaultPrompt: e.target.value,
                    })
                }
            />
            <Button
                size="small"
                variant="text"
                color="inherit"
                sx={{ opacity: 0.5, textTransform: 'none' }}
                onClick={() => {
                    setSettingsEdit({
                        ...settingsEdit,
                        defaultPrompt: defaults.getDefaultPrompt(),
                    })
                }}
            >
                {t('Reset to Default')}
            </Button>
        </Box>
    )
}
