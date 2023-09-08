import { TextField, Box } from '@mui/material'
import { ModelSettings } from '../../../shared/types'
import { Trans, useTranslation } from 'react-i18next'
import * as runtime from '../../packages/runtime'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function ChatGLM6BSetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <Box>
            <TextField
                placeholder="http://localhost:8000"
                autoFocus
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
                        {runtime.isWeb && (
                            <>
                                <br />
                                <Trans i18nKey="ChatGLM-6B Warnning for Chatbox-Web" />
                            </>
                        )}
                    </>
                }
            />
        </Box>
    )
}
