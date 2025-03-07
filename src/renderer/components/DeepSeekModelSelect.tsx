import { useEffect, useState } from 'react'
import SimpleSelect from './SimpleSelect'
import { ModelSettings, ModelOptionGroup, ModelProvider } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import * as settingActions from '../stores/settingActions'
import DeepSeekSettingUtil from '../packages/model-setting-utils/deepseek-setting-util'
import { flatten } from 'lodash'

export interface Props {
  value: ModelSettings['deepseekModel']
  onChange(value: ModelSettings['deepseekModel']): void
  className?: string
}

export default function DeepSeekModelSelect(props: Props) {
  const { t } = useTranslation()
  const [optionGroups, setOptionGroups] = useState<ModelOptionGroup[]>([])
  useEffect(() => {
    ;(async () => {
      // 先获取本地模型选项组
      const modelConfig = new DeepSeekSettingUtil()
      const settings = settingActions.getSettings()
      const localOptionGroups = modelConfig.getLocalOptionGroups({
        ...settings,
        aiProvider: ModelProvider.DeepSeek,
      })
      setOptionGroups(localOptionGroups)
      // 再获取远程模型选项组
      const mergedOptionGroups = await modelConfig.getMergeOptionGroups({
        ...settings,
        aiProvider: ModelProvider.DeepSeek,
      })
      setOptionGroups(mergedOptionGroups)
    })()
  }, [])
  const simpleOptions = flatten(optionGroups.map((group) => group.options))
  return (
    <SimpleSelect
      label={t('model')}
      value={props.value}
      options={simpleOptions}
      onChange={(value) => props.onChange(value as ModelSettings['deepseekModel'])}
      className={props.className}
    />
  )
}
