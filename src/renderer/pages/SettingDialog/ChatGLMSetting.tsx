import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'
import TemperatureSlider from '@/components/TemperatureSlider'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import { Stack, TextField, Typography } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { ModelSettings } from '../../../shared/types'
import { Accordion, AccordionDetails, AccordionSummary } from '../../components/Accordion'
import platform from '../../platform'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function ChatGLM6BSetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const isSmallScreen = useIsSmallScreen()
    return (
        <Stack spacing={2}>
            <TextField
                placeholder="http://localhost:8000"
                autoFocus={!isSmallScreen}
                margin="dense"
                label={t('ChatGLM-6B URL')}
                type="text"
                fullWidth
                variant="outlined"
                value={settingsEdit.chatglm6bUrl}
                onChange={(e) =>
                    setSettingsEdit({
                        ...settingsEdit,
                        chatglm6bUrl: e.target.value.trim(),
                    })
                }
                helperText={
                    <>
                        <Trans
                            i18nKey="ChatGLM-6B URL Helper"
                            components={[
                                <a
                                    href={'https://github.com/THUDM/ChatGLM-6B#api%E9%83%A8%E7%BD%B2'}
                                    target="_blank"
                                ></a>,
                                <a href={'https://github.com/THUDM/ChatGLM-6B'} target="_blank"></a>,
                            ]}
                        />
                        {platform.type === 'web' && (
                            <>
                                <br />
                                <Trans i18nKey="ChatGLM-6B Warnning for Chatbox-Web" />
                            </>
                        )}
                    </>
                }
            />
            <Accordion>
                <AccordionSummary aria-controls="panel1a-content">
                    <Typography>{t('Advanced')}</Typography>
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
                </AccordionDetails>
            </Accordion>
        </Stack>
    )
}
