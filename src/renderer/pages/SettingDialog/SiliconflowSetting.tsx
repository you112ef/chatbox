import MaxContextMessageCountSlider from '@/components/MaxContextMessageCountSlider'
import PasswordTextField from '@/components/PasswordTextField'
import SimpleSelect from '@/components/SimpleSelect'
import TemperatureSlider from '@/components/TemperatureSlider'
import SiliconFlow from '@/packages/models/siliconflow'
import { Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModelSettings } from '../../../shared/types'
import { Accordion, AccordionDetails, AccordionSummary } from '../../components/Accordion'

interface ModelConfigProps {
  settingsEdit: ModelSettings
  setSettingsEdit: (settings: ModelSettings) => void
}

export default function SiliconflowSetting(props: ModelConfigProps) {
  const { settingsEdit, setSettingsEdit } = props
  const { t } = useTranslation()
  return (
    <Stack spacing={2}>
      <PasswordTextField
        label={t('api key')}
        value={settingsEdit.siliconCloudKey}
        setValue={(value) => {
          setSettingsEdit({ ...settingsEdit, siliconCloudKey: value })
        }}
      />
      <SiliconflowModelSelect
        siliconCloudModel={settingsEdit.siliconCloudModel}
        setSiliconCloudModel={(value) => setSettingsEdit({ ...settingsEdit, siliconCloudModel: value })}
        siliconCloudKey={settingsEdit.siliconCloudKey}
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

export function SiliconflowModelSelect(props: {
  siliconCloudModel: ModelSettings['siliconCloudModel']
  setSiliconCloudModel: (model: ModelSettings['siliconCloudModel']) => void
  siliconCloudKey: string
  className?: string
}) {
  const { t } = useTranslation()
  const [models, setModels] = useState<string[]>([])
  useEffect(() => {
    ;(async () => {
      const model = new SiliconFlow({
        siliconCloudKey: props.siliconCloudKey,
        siliconCloudModel: props.siliconCloudModel,
      })
      const models = await model.listModels()
      setModels(models)
      if (props.siliconCloudModel && models.length > 0 && !models.includes(props.siliconCloudModel)) {
        props.setSiliconCloudModel(models[0])
      }
    })()
  }, [props.siliconCloudKey])
  return (
    <SimpleSelect
      label={t('model')}
      value={props.siliconCloudModel}
      options={models.map((model) => ({ value: model, label: model }))}
      onChange={(value) => props.setSiliconCloudModel(value as ModelSettings['siliconCloudModel'])}
      className={props.className}
    />
  )
}
