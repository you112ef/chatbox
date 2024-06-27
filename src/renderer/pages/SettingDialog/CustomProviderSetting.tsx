import { Box, MenuItem, Alert, FormControl, InputLabel, Select } from '@mui/material'
import { CustomProvider, ModelProvider, ModelSettings } from '../../../shared/types'
import { Trans, useTranslation } from 'react-i18next'
import PasswordTextField from '@/components/PasswordTextField'
import TemperatureSlider from '@/components/TemperatureSlider'
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'
import TextFieldReset from '@/components/TextFieldReset'
import TopPSlider from '@/components/TopPSlider'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function CustomProviderSetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const customProvider = settingsEdit.customProviders.find((provider) => provider.id === settingsEdit.selectedCustomProviderId)
    const setCustomProvider = (update: CustomProvider) => {
        setSettingsEdit({
            ...settingsEdit,
            customProviders: settingsEdit.customProviders.map((provider) =>
                provider.id === update.id ? { ...provider, ...update } : provider,
            ),
        })
    }
    const switchChatboxAI = () => {
        setSettingsEdit({
            ...settingsEdit,
            aiProvider: ModelProvider.ChatboxAI,
            selectedCustomProviderId: '',
        })
    }
    if (!customProvider) {
        return null
    }
    return (
        <Box>
            <Alert icon={false} severity='info' className='my-4'>
                {t("Here you can add and manage various custom model providers. As long as the provider's API is compatible with the selected API mode, you can seamlessly connect and use it within Chatbox.")}
                <br />
                <Trans i18nKey="Please note that as a client tool, Chatbox cannot guarantee the quality of service and data privacy of the model providers. If you are looking for a stable, reliable, and privacy-protecting model service, consider <a>Chatbox AI</a>."
                    components={{
                        a: <a className='cursor-pointer font-bold' onClick={switchChatboxAI}></a>,
                    }}
                />
            </Alert>

            <FormControl>
                <InputLabel>{t('API Mode')}</InputLabel>
                <Select
                    value={customProvider.api}
                    label={t("API Mode")}
                    onChange={(e) => setCustomProvider({ ...customProvider, api: e.target.value as 'openai' })}
                    size='small'
                    className='mb-1'
                >
                    <MenuItem value='openai'>
                        {t('OpenAI API Compatible')}
                    </MenuItem>
                </Select>
            </FormControl>
            <TextFieldReset
                margin="dense"
                label={t('name')}
                type="text"
                fullWidth
                variant="outlined"
                value={customProvider.name}
                placeholder={t('Untitled') || 'Untitled'}
                defaultValue={t('Untitled') || 'Untitled'}
                onValueChange={(value) => {
                    setCustomProvider({ ...customProvider, name: value })
                }}
            />
            <TextFieldReset
                margin="dense"
                label={t('api host')}
                type="text"
                fullWidth
                variant="outlined"
                value={customProvider.host}
                placeholder="https://api.openai.com"
                defaultValue='https://api.openai.com'
                onValueChange={(value) => {
                    value = value.trim()
                    if (value.length > 4 && !value.startsWith('http')) {
                        value = 'https://' + value
                    }
                    setCustomProvider({ ...customProvider, host: value })
                }}
            />
           <TextFieldReset
                margin="dense"
                label={t('api path')}
                type="text"
                fullWidth
                variant="outlined"
                value={customProvider.path}
                placeholder="/v1/chat/completions"
                defaultValue="/v1/chat/completions"
                onValueChange={(value) => {
                    setCustomProvider({ ...customProvider, path: value.trim() })
                }}
            />
            <PasswordTextField
                label={t('api key')}
                value={customProvider.key}
                setValue={(value) => {
                    setCustomProvider({ ...customProvider, key: value })
                }}
            />
            <TextFieldReset
                margin="dense"
                label={t('model')}
                type="text"
                fullWidth
                variant="outlined"
                value={customProvider.model}
                placeholder="gpt-4o"
                defaultValue='gpt-4o'
                onValueChange={(value) => {
                    setCustomProvider({ ...customProvider, model: value })
                }}
            />
            <MaxContextMessageCountSlider
                value={settingsEdit.openaiMaxContextMessageCount}
                onChange={(v) => setSettingsEdit({ ...settingsEdit, openaiMaxContextMessageCount: v })}
            />
            <TemperatureSlider
                value={settingsEdit.temperature}
                onChange={(v) => setSettingsEdit({ ...settingsEdit, temperature: v })}
            />
            <TopPSlider
                topP={settingsEdit.topP}
                setTopP={(v) => setSettingsEdit({ ...settingsEdit, topP: v })}
            />
        </Box>
    )
}
