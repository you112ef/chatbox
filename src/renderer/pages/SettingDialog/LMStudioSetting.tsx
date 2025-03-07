import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'
import SimpleSelect from '@/components/SimpleSelect'
import TemperatureSlider from '@/components/TemperatureSlider'
import TextFieldReset from '@/components/TextFieldReset'
import LMStudio from '@/packages/models/lmstudio'
import platform from '@/platform'
import { languageAtom } from '@/stores/atoms'
import { Alert, Stack, Typography } from '@mui/material'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ModelSettings } from '../../../shared/types'
import { Accordion, AccordionDetails, AccordionSummary } from '../../components/Accordion'

interface ModelConfigProps {
  settingsEdit: ModelSettings
  setSettingsEdit: (settings: ModelSettings) => void
}

export default function LMStudioSetting(props: ModelConfigProps) {
  const { settingsEdit, setSettingsEdit } = props
  const { t } = useTranslation()
  const language = useAtomValue(languageAtom)
  return (
    <Stack spacing={2}>
      <TextFieldReset
        label={t('api host')}
        value={settingsEdit.lmStudioHost}
        defaultValue="http://127.0.0.1:1234/v1"
        onValueChange={(value) => setSettingsEdit({ ...settingsEdit, lmStudioHost: value })}
        fullWidth
      />
      <Alert icon={false} severity="info">
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
                  />
                ),
              }}
            />
          </p>
        )}
        <p>
          <Trans
            i18nKey="Please ensure that the Remote LM Studio Service is able to connect remotely. For more details, refer to <a>this tutorial</a>."
            components={{
              a: (
                <a
                  className="cursor-pointer font-bold"
                  onClick={() => {
                    platform.openLink(`https://chatboxai.app/redirect_app/lm_studio_guide/${language}`)
                  }}
                />
              ),
            }}
          />
        </p>
      </Alert>
      <LMStudioModelSelect
        lmStudioModel={settingsEdit.lmStudioModel}
        setLmStudioModel={(value) => setSettingsEdit({ ...settingsEdit, lmStudioModel: value })}
        lmStudioHost={settingsEdit.lmStudioHost}
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

export function LMStudioModelSelect(props: {
  lmStudioModel: ModelSettings['lmStudioModel']
  setLmStudioModel: (model: ModelSettings['lmStudioModel']) => void
  lmStudioHost: string
  className?: string
}) {
  const { t } = useTranslation()
  const [models, setModels] = useState<string[]>([])
  useEffect(() => {
    ;(async () => {
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
