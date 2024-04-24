import SimpleSelect from './SimpleSelect'
import { SessionSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import { groqModels } from '@/packages/models/groq'

export interface Props {
    settingsEdit: SessionSettings
    setSettingsEdit: (settings: SessionSettings) => void
}

export default function GropModelSelect(props: Props) {
    const { t } = useTranslation()
    const { settingsEdit, setSettingsEdit } = props
    return (
        <SimpleSelect
            label={t('model')}
            value={settingsEdit.groqModel}
            options={groqModels.map((value) => ({ value, label: value }))}
            onChange={(value) => {
                setSettingsEdit({ ...settingsEdit, groqModel: value })
            }}
        />
    )
}
