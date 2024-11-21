import { useEffect, useState } from 'react'
import SimpleSelect from './SimpleSelect'
import { ModelSettings, ModelOptionGroup, ModelProvider } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import * as settingActions from '../stores/settingActions'
import GeminiSettingUtil from '../packages/model-setting-utils/gemini-setting-util'
import { flatten } from 'lodash'

export interface Props {
    value: ModelSettings['geminiModel']
    onChange(value: ModelSettings['geminiModel']): void
    className?: string
}

export default function GeminiModelSelect(props: Props) {
    const { t } = useTranslation()
    const [optionGroups, setOptionGroups] = useState<ModelOptionGroup[]>([])
    useEffect(() => {
        ;(async () => {
            // 先获取本地模型选项组
            const modelConfig = new GeminiSettingUtil()
            const settings = settingActions.getSettings()
            const localOptionGroups = modelConfig.getLocalOptionGroups({
                ...settings,
                aiProvider: ModelProvider.Gemini,
            })
            setOptionGroups(localOptionGroups)
            // 再获取远程模型选项组
            const mergedOptionGroups = await modelConfig.getMergeOptionGroups({
                ...settings,
                aiProvider: ModelProvider.Gemini,
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
            onChange={(value) => props.onChange(value as ModelSettings['geminiModel'])}
            className={props.className}
        />
    )
}
