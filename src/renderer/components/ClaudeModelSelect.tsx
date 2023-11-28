import SimpleSelect from './SimpleSelect'
import { claudeModels } from '../packages/models/claude'
import { SessionSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'

export interface Props {
    settingsEdit: SessionSettings
    setSettingsEdit: (settings: SessionSettings) => void
}

export default function ClaudeModelSelect(props: Props) {
    const { t } = useTranslation()
    const { settingsEdit, setSettingsEdit } = props
    return (
        <SimpleSelect
            label={t('model')}
            value={settingsEdit.claudeModel}
            options={claudeModels.map((value) => ({ value, label: value }))}
            onChange={(value) => {
                setSettingsEdit({ ...settingsEdit, claudeModel: value })
            }}
        />
    )
}
