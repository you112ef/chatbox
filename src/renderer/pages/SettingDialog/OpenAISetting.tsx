import { Button, Alert, TextField, Typography, Box } from '@mui/material'
import { ModelSettings } from '../../../shared/types'
import { Trans, useTranslation } from 'react-i18next'
import * as defaults from '../../stores/defaults'
import { Accordion, AccordionSummary, AccordionDetails } from '../../components/Accordion'
import TemperatureSlider from '../../components/TemperatureSlider'
import PasswordTextField from '../../components/PasswordTextField'
import MaxContextMessageCountSlider from '../../components/MaxContextMessageCountSlider'
import OpenAIModelSelect from '../../components/OpenAIModelSelect'
import TokenConfig from './TokenConfig'

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
                <TextField
                    margin="dense"
                    label={t('api host')}
                    type="text"
                    fullWidth
                    variant="outlined"
                    placeholder="https://api.openai.com"
                    value={settingsEdit.apiHost}
                    onChange={(e) =>
                        setSettingsEdit({
                            ...settingsEdit,
                            apiHost: e.target.value.trim(),
                        })
                    }
                />
                {!settingsEdit.apiHost.match(/^(https?:\/\/)?api.openai.com(:\d+)?$/) && (
                    <Alert severity="warning">
                        {t('proxy warning', {
                            apiHost: settingsEdit.apiHost,
                        })}
                        <Button
                            onClick={() =>
                                setSettingsEdit({
                                    ...settingsEdit,
                                    apiHost: defaults.settings().apiHost,
                                })
                            }
                        >
                            {t('reset')}
                        </Button>
                    </Alert>
                )}
                {settingsEdit.apiHost.startsWith('http://') && (
                    <Alert severity="warning">
                        {<Trans i18nKey="protocol warning" components={{ bold: <strong /> }} />}
                    </Alert>
                )}
                {!settingsEdit.apiHost.startsWith('http') && (
                    <Alert severity="error">
                        {<Trans i18nKey="protocol error" components={{ bold: <strong /> }} />}
                    </Alert>
                )}
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
