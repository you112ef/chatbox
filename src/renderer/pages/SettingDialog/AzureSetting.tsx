import { Button, Alert, TextField, Typography, Box } from '@mui/material'
import { ModelSettings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import * as defaults from '../../../shared/defaults'
import { Accordion, AccordionSummary, AccordionDetails } from '../../components/Accordion'
import TemperatureSlider from '../../components/TemperatureSlider'
import TopPSlider from '../../components/TopPSlider'
import PasswordTextField from '../../components/PasswordTextField'
// import TokenConfig from './TokenConfig'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'
import CreatableSelect from '@/components/CreatableSelect'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function AzureSetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const isSmallScreen = useIsSmallScreen()
    return (
        <Box>
            <TextField
                placeholder="https://<resource_name>.openai.azure.com/"
                autoFocus={!isSmallScreen}
                margin="dense"
                label={t('Azure Endpoint')}
                type="text"
                fullWidth
                variant="outlined"
                value={settingsEdit.azureEndpoint}
                onChange={(e) =>
                    setSettingsEdit({
                        ...settingsEdit,
                        azureEndpoint: e.target.value.trim(),
                    })
                }
            />
            <PasswordTextField
                label={t('Azure API Key')}
                value={settingsEdit.azureApikey}
                setValue={(value) => {
                    setSettingsEdit({ ...settingsEdit, azureApikey: value })
                }}
            />
            <CreatableSelect
                label={t('Azure Deployment Name')}
                value={settingsEdit.azureDeploymentName}
                options={settingsEdit.azureDeploymentNameOptions}
                onChangeValue={(v) => setSettingsEdit({ ...settingsEdit, azureDeploymentName: v })}
                onUpdateOptions={(v) => setSettingsEdit({ ...settingsEdit, azureDeploymentNameOptions: v })}
            />

            <TextField
                margin="dense"
                label={t('Azure Dall-E Deployment Name')}
                type="text"
                fullWidth
                variant="outlined"
                value={settingsEdit.azureDalleDeploymentName}
                onChange={(e) =>
                    setSettingsEdit({
                        ...settingsEdit,
                        azureDalleDeploymentName: e.target.value.trim(),
                    })
                }
            />
            <Accordion>
                <AccordionSummary aria-controls="panel1a-content">
                    <Typography>
                        {t('model')} & {t('token')}{' '}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
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
                </AccordionDetails>
            </Accordion>
        </Box>
    )
}
