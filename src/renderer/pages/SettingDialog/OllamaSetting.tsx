import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { SessionSettings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import TemperatureSlider from '@/components/TemperatureSlider'
import TextFieldReset from '@/components/TextFieldReset'
import { useEffect, useState } from 'react'
import Ollama from '@/packages/models/ollama'
import platform from '@/platform'
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'

interface ModelConfigProps {
    settingsEdit: SessionSettings
    setSettingsEdit: (settings: SessionSettings) => void
}

export default function OllamaSetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const [models, setModels] = useState<string[]>([])
    useEffect(() => {
        const model = new Ollama(settingsEdit)
        model.listModels().then((models) => {
            setModels(models)
        })
        if (settingsEdit.ollamaModel && models.length > 0 && !models.includes(settingsEdit.ollamaModel)) {
            setSettingsEdit({ ...settingsEdit, ollamaModel: models[0] })
        }
    }, [settingsEdit.ollamaHost])
    return (
        <Box>
            <TextFieldReset
                label={t('api host')}
                value={settingsEdit.ollamaHost}
                defaultValue='http://localhost:11434'
                onValueChange={(value) => {
                    setSettingsEdit({ ...settingsEdit, ollamaHost: value })
                }}
                fullWidth
            />
            {
                settingsEdit.ollamaHost && settingsEdit.ollamaHost.includes('http://localhost') && platform.type === 'web' && (
                    <Alert severity="warning">
                        {t('To access locally deployed model services, please install the Chatbox desktop version')}
                        <Button onClick={() => platform.openLink('https://chatboxai.app/')}>
                            {t('Download')}
                        </Button>
                    </Alert>
                )
            }
            <FormControl fullWidth variant="outlined" margin="dense">
                <InputLabel htmlFor="ollama-model-select">{t('model')}</InputLabel>
                <Select
                    label={t('model')}
                    id="ollama-model-select"
                    value={settingsEdit.ollamaModel}
                    onChange={(e) =>
                        setSettingsEdit({ ...settingsEdit, ollamaModel: e.target.value as any })
                    }
                >
                    {models.map((model) => (
                        <MenuItem key={model} value={model}>
                            {model}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <MaxContextMessageCountSlider
                settingsEdit={settingsEdit}
                setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
            />
            <TemperatureSlider
                settingsEdit={settingsEdit}
                setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
            />
        </Box>
    )
}
