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
import { Session, ModelProvider, ModelSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import * as sessionActions from '../stores/sessionActions'
import { AiProviderSelect, ModelSelect, TokenConfig, wrapDefaultTokenConfigUpdate } from './SettingWindow'
import TemperatureSlider from '../components/TemperatureSlider'
import MaxContextMessageCountSlider from '../components/MaxContextMessageCountSlider'
import * as atoms from '../stores/atoms'
import { useAtomValue } from 'jotai'
import { Accordion, AccordionSummary, AccordionDetails } from '../components/Accordion'
import ClaudeModelSelect from '../components/ClaudeModelSelect'
import ChatboxAIModelSelect from '../components/ChatboxAIModelSelect'

interface Props {
    open: boolean
    session: Session
    close(): void
}

export default function ChatConfigWindow(props: Props) {
    const { t } = useTranslation()
    const settings = useAtomValue(atoms.settingsAtom)
    const [dataEdit, setDataEdit] = React.useState<Session>(props.session)

    useEffect(() => {
        setDataEdit(props.session)
    }, [props.session])

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
    const setSettingsEdit = (updated: ModelSettings) => {
        if (settingsEdit?.aiProvider !== updated.aiProvider || settingsEdit?.model !== updated.model) {
            updated = wrapDefaultTokenConfigUpdate(updated)
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
                            dataEdit.settings = settings
                        } else {
                            dataEdit.settings = undefined
                        }
                        setDataEdit({ ...dataEdit })
                    }}
                    sx={{ margin: '12px 0' }}
                />
                {settingsEdit && (
                    <>
                        <AiProviderSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
                        <Divider sx={{ margin: '16px 0' }} />
                        {settingsEdit.aiProvider === ModelProvider.ChatboxAI && (
                            <>
                                {settingsEdit.licenseDetail && (
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
                        {(settingsEdit.aiProvider === ModelProvider.OpenAI ||
                            settingsEdit.aiProvider === ModelProvider.Azure) && (
                            <>
                                <ModelSelect settingsEdit={settingsEdit} setSettingsEdit={setSettingsEdit} />
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
