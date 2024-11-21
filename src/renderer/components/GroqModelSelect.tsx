import { useEffect, useState } from 'react'
import SimpleSelect from './SimpleSelect'
import { ModelSettings, ModelOptionGroup, ModelProvider } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import * as settingActions from '../stores/settingActions'
import GroqSettingUtil from '../packages/model-setting-utils/groq-setting-util'
import { flatten } from 'lodash'

export interface Props {
    value: ModelSettings['groqModel']
    onChange(value: ModelSettings['groqModel']): void
    className?: string
}

export default function GropModelSelect(props: Props) {
    const { t } = useTranslation()
    const [optionGroups, setOptionGroups] = useState<ModelOptionGroup[]>([])
    useEffect(() => {
        ;(async () => {
            // 先获取本地模型选项组
            const modelConfig = new GroqSettingUtil()
            const settings = settingActions.getSettings()
            const localOptionGroups = modelConfig.getLocalOptionGroups({
                ...settings,
                aiProvider: ModelProvider.Groq,
            })
            setOptionGroups(localOptionGroups)
            // 再获取远程模型选项组
            const mergedOptionGroups = await modelConfig.getMergeOptionGroups({
                ...settings,
                aiProvider: ModelProvider.Groq,
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
            onChange={(value) => props.onChange(value as ModelSettings['groqModel'])}
            className={props.className}
        />
    )
}
