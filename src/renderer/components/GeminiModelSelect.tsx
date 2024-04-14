import SimpleSelect from './SimpleSelect'
import { SessionSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import { geminiModels } from '@/packages/models/gemini'

export interface Props {
    settingsEdit: SessionSettings
    setSettingsEdit: (settings: SessionSettings) => void
}

export default function GeminiModelSelect(props: Props) {
    const { t } = useTranslation()
    const { settingsEdit, setSettingsEdit } = props
    return (
        <SimpleSelect
            label={t('model')}
            value={settingsEdit.geminiModel}
            options={geminiModels.map((value) => ({ value, label: value }))}
            onChange={(value) => {
                setSettingsEdit({ ...settingsEdit, geminiModel: value })
            }}
        />
    )
}
