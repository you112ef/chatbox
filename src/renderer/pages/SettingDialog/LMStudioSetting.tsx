import { ModelSettings } from '../../../shared/types'
import { useEffect, useState } from 'react'
import LMStudio from '@/packages/models/lmstudio'
import SimpleSelect from '@/components/SimpleSelect'
import { Box } from '@mui/material'
import TemperatureSlider from '@/components/TemperatureSlider'
import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'
import { Trans, useTranslation } from 'react-i18next'
import { Alert } from '@mui/material'
import platform from '@/platform'
import { useAtomValue } from 'jotai'
import { languageAtom } from '@/stores/atoms'
import TextFieldReset from '@/components/TextFieldReset'

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function LMStudioSetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const language = useAtomValue(languageAtom)
    return (
        <Box>
            <TextFieldReset
                label={t('api host')}
                value={settingsEdit.lmStudioHost}
                defaultValue="http://127.0.0.1:1234/v1"
                onValueChange={(value) => setSettingsEdit({ ...settingsEdit, lmStudioHost: value })}
                fullWidth
            />
            <Alert icon={false} severity='info' className='my-4'>
                <Trans i18nKey='Please ensure that the Remote LM Studio Service is able to connect remotely. For more details, refer to <a>this tutorial</a>.'
                    components={{
                        a: <a className='cursor-pointer font-bold' onClick={() => {
                            platform.openLink(`https://chatboxai.app/redirect_app/lm_studio_guide/${language}`)
                        }}></a>,
                    }}
                />
            </Alert>
            <LMStudioModelSelect
                lmStudioModel={settingsEdit.lmStudioModel}
                setLmStudioModel={(value) => setSettingsEdit({ ...settingsEdit, lmStudioModel: value })}
                lmStudioHost={settingsEdit.lmStudioHost}
            />
            <MaxContextMessageCountSlider
                value={settingsEdit.openaiMaxContextMessageCount}
                onChange={(v) => setSettingsEdit({ ...settingsEdit, openaiMaxContextMessageCount: v })}
            />
            <TemperatureSlider
                value={settingsEdit.temperature}
                onChange={(v) => setSettingsEdit({ ...settingsEdit, temperature: v })}
            />
        </Box>
    )
}

export function LMStudioModelSelect(props: {
    lmStudioModel: ModelSettings['lmStudioModel']
    setLmStudioModel: (model: ModelSettings['lmStudioModel']) => void
    lmStudioHost: string
    className?: string
}) {
    const { t } = useTranslation()
    const [models, setModels] = useState<string[]>([])
    useEffect(() => {
        ; (async () => {
            const model = new LMStudio({
                lmStudioHost: props.lmStudioHost,
                lmStudioModel: props.lmStudioModel,
            })
            const models = await model.listModels()
            setModels(models)
            if (props.lmStudioModel && models.length > 0 && !models.includes(props.lmStudioModel)) {
                props.setLmStudioModel(models[0])
            }
        })()
    }, [props.lmStudioHost])
    return (
        <SimpleSelect
            label={t('model')}
            value={props.lmStudioModel}
            options={models.map((model) => ({ value: model, label: model }))}
            onChange={(value) => props.setLmStudioModel(value as ModelSettings['lmStudioModel'])}
            className={props.className}
        />
    )
}
