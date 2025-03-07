import { useEffect, useState } from 'react'
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { ModelProvider, ModelSettings, ModelOptionGroup } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import CreatableSelect from '@/components/CreatableSelect'
import OpenAISettingUtil from '../packages/model-setting-utils/openai-setting-util'
import * as settingActions from '../stores/settingActions'
import { flatten } from 'lodash'

export interface Props {
  model: ModelSettings['model']
  openaiCustomModel: ModelSettings['openaiCustomModel']
  openaiCustomModelOptions: ModelSettings['openaiCustomModelOptions']
  onUpdateModel(updated: ModelSettings['model']): void
  onUpdateOpenaiCustomModel(updated: ModelSettings['openaiCustomModel']): void
  onUpdateOpenaiCustomModelOptions(updated: ModelSettings['openaiCustomModelOptions']): void
  className?: string
}

export default function OpenAIModelSelect(props: Props) {
  const {
    model,
    openaiCustomModel,
    openaiCustomModelOptions,
    onUpdateModel,
    onUpdateOpenaiCustomModel,
    onUpdateOpenaiCustomModelOptions,
    className,
  } = props
  const { t } = useTranslation()
  const [optionGroups, setOptionGroups] = useState<ModelOptionGroup[]>([])
  useEffect(() => {
    ;(async () => {
      // 先获取本地模型选项组
      const modelConfig = new OpenAISettingUtil()
      const settings = settingActions.getSettings()
      const localOptionGroups = modelConfig.getLocalOptionGroups({
        ...settings,
        aiProvider: ModelProvider.OpenAI,
      })
      setOptionGroups(localOptionGroups)
      // 再获取远程模型选项组
      const mergedOptionGroups = await modelConfig.getMergeOptionGroups({
        ...settings,
        aiProvider: ModelProvider.OpenAI,
      })
      setOptionGroups(mergedOptionGroups)
    })()
  }, [])
  const simpleOptions = flatten(optionGroups.map((group) => group.options))
  return (
    <FormControl fullWidth variant="outlined" margin="dense" className={className}>
      <InputLabel htmlFor="model-select">{t('model')}</InputLabel>
      <Select
        label={t('model')}
        id="model-select"
        value={model}
        onChange={(e) => onUpdateModel(e.target.value as ModelSettings['model'])}
      >
        {simpleOptions.map(({ value: model }) => (
          <MenuItem key={model} value={model}>
            {model}
          </MenuItem>
        ))}
        <MenuItem key="custom-model" value={'custom-model'}>
          {t('Custom Model')}
        </MenuItem>
      </Select>
      {props.model === 'custom-model' && (
        <CreatableSelect
          label={t('Custom Model Name')}
          value={openaiCustomModel || ''}
          options={openaiCustomModelOptions}
          onChangeValue={(updated) => onUpdateOpenaiCustomModel(updated)}
          onUpdateOptions={(updated) => onUpdateOpenaiCustomModelOptions(updated)}
        />
      )}
    </FormControl>
  )
}
