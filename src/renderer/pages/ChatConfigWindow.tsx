import React, { useEffect } from 'react'
import {
    FormControlLabel,
    Switch,
    Divider,
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    DialogContentText,
    TextField,
} from '@mui/material'
import { Session, ModelProvider, SessionSettings, settings2SessionSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import * as sessionActions from '../stores/sessionActions'
import TemperatureSlider from '../components/TemperatureSlider'
import TopPSlider from '../components/TopPSlider'
import MaxContextMessageCountSlider from '../components/MaxContextMessageCountSlider'
import * as atoms from '../stores/atoms'
import { useAtomValue } from 'jotai'
import { Accordion, AccordionSummary, AccordionDetails } from '../components/Accordion'
import ClaudeModelSelect from '../components/ClaudeModelSelect'
import ChatboxAIModelSelect from '../components/ChatboxAIModelSelect'
import { resetTokenConfig } from '../packages/token_config'
import AIProviderSelect from '../components/AIProviderSelect'
import OpenAIModelSelect from '../components/OpenAIModelSelect'
import TokenConfig from './SettingDialog/TokenConfig'

interface Props {
    open: boolean
    session: Session
    close(): void
}

export default function ChatConfigWindow(props: Props) {
    const { t } = useTranslation()
    const settings = useAtomValue(atoms.settingsAtom)
    const licenseDetail = useAtomValue(atoms.licenseDetailAtom)
    const [dataEdit, setDataEdit] = React.useState<Session>(props.session)

    useEffect(() => {
        setDataEdit(props.session)
    }, [props.session])
    useEffect(() => {
        if (props.open) {
            window.gtag('event', 'screen_view', { screen_name: 'chat_config_window' })
        }
    }, [props.open])

    const onCancel = () => {
        props.close()
        setDataEdit(props.session)
    }

    const onSave = () => {
        if (dataEdit.name === '') {
            dataEdit.name = props.session.name
        }
        dataEdit.name = dataEdit.name.trim()
        sessionActions.modify(dataEdit)
        props.close()
    }

    const settingsEdit = dataEdit.settings
    const setSettingsEdit = (updated: SessionSettings) => {
        if (settingsEdit?.aiProvider !== updated.aiProvider || settingsEdit?.model !== updated.model) {
            updated = resetTokenConfig(updated)
        }
        setDataEdit({ ...dataEdit, settings: updated })
    }

    return (
        <Dialog open={props.open} onClose={onCancel} fullWidth>
            <DialogTitle>{t('Conversation Settings')}</DialogTitle>
            <DialogContent>
                <DialogContentText></DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    label={t('name')}
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={dataEdit.name}
                    onChange={(e) => setDataEdit({ ...dataEdit, name: e.target.value })}
                />
                <FormControlLabel
                    control={<Switch size="medium" />}
                    label={t('Specific model settings')}
                    checked={!!dataEdit.settings}
                    onChange={(e, checked) => {
                        if (checked) {
                            dataEdit.settings = settings2SessionSettings(settings)
                        } else {
                            dataEdit.settings = undefined
                        }
                        setDataEdit({ ...dataEdit })
                    }}
                    sx={{ margin: '12px 0' }}
                />
                {settingsEdit && (
                    <>
                        <AIProviderSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                        <Divider sx={{ margin: '16px 0' }} />
                        {settingsEdit.aiProvider === ModelProvider.ChatboxAI && (
                            <>
                                {licenseDetail && (
                                    <ChatboxAIModelSelect
                                        settingsEdit={settingsEdit}
                                        setSettingsEdit={setSettingsEdit}
                                    />
                                )}
                                <MaxContextMessageCountSlider
                                    settingsEdit={settingsEdit}
                                    setSettingsEdit={setSettingsEdit}
                                />
                                <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            </>
                        )}
                        {settingsEdit.aiProvider === ModelProvider.OpenAI && (
                            <>
                                <OpenAIModelSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                <MaxContextMessageCountSlider
                                    settingsEdit={settingsEdit}
                                    setSettingsEdit={setSettingsEdit}
                                />
                                <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                <Accordion>
                                    <AccordionSummary aria-controls="panel1a-content">
                                        {t('model')} & {t('token')}
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <TokenConfig settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                        <TopPSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                    </AccordionDetails>
                                </Accordion>
                            </>
                        )}
                        {settingsEdit.aiProvider === ModelProvider.Azure && (
                            <>
                                <TextField
                                    margin="dense"
                                    label={t('Azure Deployment Name')}
                                    type="text"
                                    fullWidth
                                    variant="outlined"
                                    value={settingsEdit.azureDeploymentName}
                                    onChange={(e) =>
                                        setSettingsEdit({
                                            ...settingsEdit,
                                            azureDeploymentName: e.target.value.trim(),
                                        })
                                    }
                                />
                                <MaxContextMessageCountSlider
                                    settingsEdit={settingsEdit}
                                    setSettingsEdit={setSettingsEdit}
                                />
                                <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                <Accordion>
                                    <AccordionSummary aria-controls="panel1a-content">
                                        {t('model')} & {t('token')}
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <TokenConfig settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                        <TopPSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                    </AccordionDetails>
                                </Accordion>
                            </>
                        )}
                        {settingsEdit.aiProvider === ModelProvider.ChatGLM6B && (
                            <>
                                <MaxContextMessageCountSlider
                                    settingsEdit={settingsEdit}
                                    setSettingsEdit={setSettingsEdit}
                                />
                                <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            </>
                        )}
                        {settingsEdit.aiProvider === ModelProvider.Claude && (
                            <>
                                <ClaudeModelSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                                <MaxContextMessageCountSlider
                                    settingsEdit={settingsEdit}
                                    setSettingsEdit={setSettingsEdit}
                                />
                                <TemperatureSlider settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                            </>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{t('cancel')}</Button>
                <Button onClick={onSave}>{t('save')}</Button>
            </DialogActions>
        </Dialog>
    )
}
