import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'
import PasswordTextField from '@/components/PasswordTextField'
import SimpleSelect from '@/components/SimpleSelect'
import TemperatureSlider from '@/components/TemperatureSlider'
import XAI from '@/packages/models/xai'
import { Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModelSettings } from '../../../shared/types'
import { Accordion, AccordionDetails, AccordionSummary } from '../../components/Accordion'

interface ModelConfigProps {
  settingsEdit: ModelSettings
  setSettingsEdit: (settings: ModelSettings) => void
}

export default function XAISetting(props: ModelConfigProps) {
  const { settingsEdit, setSettingsEdit } = props
  const { t } = useTranslation()
  return (
    <Stack spacing={2}>
      <PasswordTextField
        label={t('api key')}
        value={settingsEdit.xAIKey}
        setValue={(value) => {
          setSettingsEdit({ ...settingsEdit, xAIKey: value })
        }}
      />
      <XAIModelSelect
        xAIModel={settingsEdit.xAIModel}
        setXAIModel={(value) => setSettingsEdit({ ...settingsEdit, xAIModel: value })}
        xAIKey={settingsEdit.xAIKey}
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

export function XAIModelSelect(props: {
  xAIModel: ModelSettings['xAIModel']
  setXAIModel: (model: ModelSettings['xAIModel']) => void
  xAIKey: string
  className?: string
}) {
  const { t } = useTranslation()
  const [models, setModels] = useState<string[]>([])
  useEffect(() => {
    ;(async () => {
      const model = new XAI({
        xAIKey: props.xAIKey,
        xAIModel: props.xAIModel,
      })
      const models = await model.listModels()
      setModels(models)
      if (props.xAIModel && models.length > 0 && !models.includes(props.xAIModel)) {
        props.setXAIModel(models[0])
      }
    })()
  }, [props.xAIKey])
  return (
    <SimpleSelect
      label={t('model')}
      value={props.xAIModel}
      options={models.map((model) => ({ value: model, label: model }))}
      onChange={(value) => props.setXAIModel(value as ModelSettings['xAIModel'])}
      className={props.className}
    />
  )
}
