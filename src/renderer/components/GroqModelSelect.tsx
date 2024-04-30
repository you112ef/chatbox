import SimpleSelect from './SimpleSelect'
import { ModelSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import { groqModels } from '@/packages/models/groq'

export interface Props {
    value: ModelSettings['groqModel']
    onChange(value: ModelSettings['groqModel']): void
    className?: string
}

export default function GropModelSelect(props: Props) {
    const { t } = useTranslation()
    return (
        <SimpleSelect
            label={t('model')}
            value={props.value}
            options={groqModels.map((value) => ({ value, label: value }))}
            onChange={props.onChange}
            className={props.className}
        />
    )
}
