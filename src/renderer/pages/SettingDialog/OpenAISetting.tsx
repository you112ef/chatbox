import { Button, Alert, TextField, Typography, Box } from '@mui/material'
import { ModelSettings } from '../../../shared/types'
import { Trans, useTranslation } from 'react-i18next'
import * as defaults from '../../stores/defaults'
import { Accordion, AccordionSummary, AccordionDetails } from '../../components/Accordion'
import TemperatureSlider from '../../components/TemperatureSlider'
import TopPSlider from '../../components/TopPSlider'
import PasswordTextField from '../../components/PasswordTextField'
import MaxContextMessageCountSlider from '../../components/MaxContextMessageCountSlider'
import OpenAIModelSelect from '../../components/OpenAIModelSelect'
import TokenConfig from './TokenConfig'
import TextFieldReset from '@/components/TextFieldReset'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function OpenAISetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <Box>
            <PasswordTextField
                label={t('openai api key')}
                value={settingsEdit.openaiKey}
                setValue={(value) => {
                    setSettingsEdit({ ...settingsEdit, openaiKey: value })
                }}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <>
                <TextFieldReset
                    margin="dense"
                    label={t('api host')}
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={settingsEdit.apiHost}
                    placeholder="https://api.openai.com"
                    defaultValue='https://api.openai.com'
                    onValueChange={(value) => {
                        value = value.trim()
                        if (value.length > 4 && !value.startsWith('http')) {
                            value = 'https://' + value
                        }
                        setSettingsEdit({ ...settingsEdit, apiHost: value })
                    }}
                />
            </>
            <Accordion>
                <AccordionSummary aria-controls="panel1a-content">
                    <Typography>
                        {t('model')} & {t('token')}{' '}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Alert severity="warning">
                        {t('settings modify warning')}
                        {t('please make sure you know what you are doing.')}
                        {t('click here to')}
                        <Button
                            onClick={() =>
                                setSettingsEdit({
                                    ...settingsEdit,
                                    model: defaults.settings().model,
                                    temperature: defaults.settings().temperature,
                                    topP: defaults.settings().topP,
                                })
                            }
                        >
                            {t('reset')}
                        </Button>
                        {t('to default values.')}
                    </Alert>

                    <OpenAIModelSelect
                        settingsEdit={settingsEdit}
                        setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
                    />

                    <TemperatureSlider
                        settingsEdit={settingsEdit}
                        setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
                    />
                    <TopPSlider
                        settingsEdit={settingsEdit}
                        setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
                    />
                    <MaxContextMessageCountSlider
                        settingsEdit={settingsEdit}
                        setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
                    />

                    <TokenConfig
                        settingsEdit={settingsEdit}
                        setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
                    />
                </AccordionDetails>
            </Accordion>
        </Box>
    )
}
