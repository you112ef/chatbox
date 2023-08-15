import SimpleSelect from './SimpleSelect'
import { claudeModels } from '../config'
import { ModelSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'

export interface Props {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function ClaudeModelSelect(props: Props) {
    const { t } = useTranslation()
    const { settingsEdit, setSettingsEdit } = props
    return (
        <SimpleSelect
            label={t('model')}
            value={settingsEdit.claudeModel}
            options={claudeModels}
            onChange={(value) => {
                setSettingsEdit({ ...settingsEdit, claudeModel: value })
            }}
        />
    )
}
