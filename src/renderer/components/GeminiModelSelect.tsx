import SimpleSelect from './SimpleSelect'
import { ModelSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import { geminiModels } from '@/packages/models/gemini'

export interface Props {
    value: ModelSettings['geminiModel']
    onChange(value: ModelSettings['geminiModel']): void
    className?: string
}

export default function GeminiModelSelect(props: Props) {
    const { t } = useTranslation()
    return (
        <SimpleSelect
            label={t('model')}
            value={props.value}
            options={geminiModels.map((value) => ({ value, label: value }))}
            onChange={props.onChange}
            className={props.className}
        />
    )
}
