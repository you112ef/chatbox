import SimpleSelect from './SimpleSelect'
import { claudeModels } from '../packages/models/claude'
import { ModelSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'

export interface Props {
    value: ModelSettings['claudeModel']
    onChange(value: ModelSettings['claudeModel']): void
    className?: string
}

export default function ClaudeModelSelect(props: Props) {
    const { t } = useTranslation()
    return (
        <SimpleSelect
            label={t('model')}
            value={props.value}
            options={claudeModels.map((value) => ({ value, label: value }))}
            onChange={props.onChange}
            className={props.className}
        />
    )
}
