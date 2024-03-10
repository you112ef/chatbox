import { FormGroup, FormControlLabel, Switch, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material'
import { Settings, ThemeMode } from '../../../shared/types'
import ThemeChangeButton from '../../theme/ThemeChangeIcon'
import { useTranslation } from 'react-i18next'
import { languageNameMap, languages } from '../../i18n/locales'
import TranslateIcon from '@mui/icons-material/Translate'

export default function DisplaySettingTab(props: {
    settingsEdit: Settings
    setSettingsEdit: (settings: Settings) => void
    changeModeWithPreview: (newMode: ThemeMode) => void
}) {
    const { settingsEdit, setSettingsEdit, changeModeWithPreview } = props
    const { t } = useTranslation()
    return (
        <Box>
            <FormControl fullWidth variant="outlined" margin="dense">
                <InputLabel htmlFor="language-select">
                    <span className="inline-flex items-center justify-center">
                        <TranslateIcon fontSize="small" />
                        {t('language')}
                    </span>
                </InputLabel>
                <Select
                    label={
                        <span className="inline-flex items-center justify-center">
                            <TranslateIcon fontSize="small" />
                            {t('language')}
                        </span>
                    }
                    id="language-select"
                    value={settingsEdit.language}
                    onChange={(e) => {
                        setSettingsEdit({
                            ...settingsEdit,
                            language: e.target.value as any,
                        })
                    }}
                >
                    {languages.map((language) => (
                        <MenuItem key={language} value={language}>
                            {languageNameMap[language]}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl fullWidth variant="outlined" margin="dense">
                <InputLabel>{t('Font Size')}</InputLabel>
                <Select
                    labelId="select-font-size"
                    value={settingsEdit.fontSize}
                    label={t('Font Size')}
                    onChange={(event) => {
                        setSettingsEdit({
                            ...settingsEdit,
                            fontSize: event.target.value as number,
                        })
                    }}
                >
                    {[10, 11, 12, 13, 14, 15, 16, 17, 18].map((size) => (
                        <MenuItem key={size} value={size}>
                            {size}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl
                sx={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingTop: 1,
                    paddingBottom: 1,
                }}
            >
                <span style={{ marginRight: 10 }}>{t('theme')}</span>
                <ThemeChangeButton value={settingsEdit.theme} onChange={(theme) => changeModeWithPreview(theme)} />
            </FormControl>
            <FormGroup>
                <FormControlLabel
                    control={<Switch />}
                    label={t('show message word count')}
                    checked={settingsEdit.showWordCount}
                    onChange={(e, checked) =>
                        setSettingsEdit({
                            ...settingsEdit,
                            showWordCount: checked,
                        })
                    }
                />
                <FormControlLabel
                    control={<Switch />}
                    label={t('show message token count')}
                    checked={settingsEdit.showTokenCount}
                    onChange={(e, checked) =>
                        setSettingsEdit({
                            ...settingsEdit,
                            showTokenCount: checked,
                        })
                    }
                />
                <FormControlLabel
                    control={<Switch />}
                    label={t('show message token usage')}
                    checked={settingsEdit.showTokenUsed}
                    onChange={(e, checked) =>
                        setSettingsEdit({
                            ...settingsEdit,
                            showTokenUsed: checked,
                        })
                    }
                />
                <FormControlLabel
                    control={<Switch />}
                    label={t('show model name')}
                    checked={settingsEdit.showModelName}
                    onChange={(e, checked) =>
                        setSettingsEdit({
                            ...settingsEdit,
                            showModelName: checked,
                        })
                    }
                />
                <FormControlLabel
                    control={<Switch />}
                    label={t('show message timestamp')}
                    checked={settingsEdit.showMessageTimestamp}
                    onChange={(e, checked) =>
                        setSettingsEdit({
                            ...settingsEdit,
                            showMessageTimestamp: checked,
                        })
                    }
                />
            </FormGroup>
        </Box>
    )
}
