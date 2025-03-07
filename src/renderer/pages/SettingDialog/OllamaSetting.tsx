import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'
import TemperatureSlider from '@/components/TemperatureSlider'
import TextFieldReset from '@/components/TextFieldReset'
import Ollama from '@/packages/models/ollama'
import platform from '@/platform'
import { languageAtom } from '@/stores/atoms'
import { Alert, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ModelSettings } from '../../../shared/types'
import { Accordion, AccordionDetails, AccordionSummary } from '../../components/Accordion'

export function OllamaHostInput(props: {
    ollamaHost: string
    setOllamaHost: (host: string) => void
    className?: string
}) {
    const { t } = useTranslation()
    const language = useAtomValue(languageAtom)
    return (
        <>
            <TextFieldReset
                label={t('api host')}
                value={props.ollamaHost}
                defaultValue="http://localhost:11434"
                onValueChange={props.setOllamaHost}
                fullWidth
                className={props.className}
            />
            <Alert icon={false} severity="info" className="my-4">
                {platform.type === 'web' && (
                    <p>
                        <Trans
                            i18nKey="Get better connectivity and stability with the Chatbox desktop application. <a>Download now</a>."
                            components={{
                                a: (
                                    <a
                                        className="cursor-pointer font-bold"
                                        onClick={() => {
                                            platform.openLink(`https://chatboxai.app`)
                                        }}
                                    ></a>
                                ),
                            }}
                        />
                    </p>
                )}
                <p>
                    <Trans
                        i18nKey="Please ensure that the Remote Ollama Service is able to connect remotely. For more details, refer to <a>this tutorial</a>."
                        components={{
                            a: (
                                <a
                                    className="cursor-pointer font-bold"
                                    onClick={() => {
                                        platform.openLink(`https://chatboxai.app/redirect_app/ollama_guide/${language}`)
                                    }}
                                ></a>
                            ),
                        }}
                    />
                </p>
            </Alert>
        </>
    )
}

export function OllamaModelSelect(props: {
    ollamaModel: ModelSettings['ollamaModel']
    setOlamaModel: (model: ModelSettings['ollamaModel']) => void
    ollamaHost: string
    className?: string
}) {
    const { t } = useTranslation()
    const [models, setModels] = useState<string[]>([])
    useEffect(() => {
        const model = new Ollama({
            ollamaHost: props.ollamaHost,
            ollamaModel: props.ollamaModel,
            temperature: 0.5,
        })
        model.listModels().then((models) => {
            setModels(models)
        })
        if (props.ollamaModel && models.length > 0 && !models.includes(props.ollamaModel)) {
            props.setOlamaModel(models[0])
        }
    }, [props.ollamaHost])
    return (
        <FormControl fullWidth variant="outlined" margin="dense" className={props.className}>
            <InputLabel htmlFor="ollama-model-select">{t('model')}</InputLabel>
            <Select
                label={t('model')}
                id="ollama-model-select"
                value={props.ollamaModel}
                onChange={(e) => props.setOlamaModel(e.target.value)}
            >
                {models.map((model) => (
                    <MenuItem key={model} value={model}>
                        {model}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function OllamaSetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    return (
        <Stack spacing={2}>
            <OllamaHostInput
                ollamaHost={settingsEdit.ollamaHost}
                setOllamaHost={(v) => setSettingsEdit({ ...settingsEdit, ollamaHost: v })}
            />
            <OllamaModelSelect
                ollamaModel={settingsEdit.ollamaModel}
                setOlamaModel={(v) => setSettingsEdit({ ...settingsEdit, ollamaModel: v })}
                ollamaHost={settingsEdit.ollamaHost}
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
