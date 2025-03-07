import { useState, useEffect } from 'react'
import SimpleSelect from './SimpleSelect'
import { ModelSettings, ModelOptionGroup, ModelProvider } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import ClaudeSettingUtil from '@/packages/model-setting-utils/claude-setting-util'
import * as settingActions from '@/stores/settingActions'
import { flatten } from 'lodash'

export interface Props {
  value: ModelSettings['claudeModel']
  onChange(value: ModelSettings['claudeModel']): void
  className?: string
}

export default function ClaudeModelSelect(props: Props) {
  const { t } = useTranslation()
  const [optionGroups, setOptionGroups] = useState<ModelOptionGroup[]>([])
  useEffect(() => {
    ;(async () => {
      // 先获取本地模型选项组
      const modelConfig = new ClaudeSettingUtil()
      const settings = settingActions.getSettings()
      const localOptionGroups = modelConfig.getLocalOptionGroups({
        ...settings,
        aiProvider: ModelProvider.Claude,
      })
      setOptionGroups(localOptionGroups)
      // 再获取远程模型选项组
      const mergedOptionGroups = await modelConfig.getMergeOptionGroups({
        ...settings,
        aiProvider: ModelProvider.Claude,
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
      onChange={(value) => props.onChange(value as ModelSettings['claudeModel'])}
      className={props.className}
    />
  )
}
