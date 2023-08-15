import { TextField, Slider, Typography, Box } from '@mui/material'
import { ModelSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'

export interface Props {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function MaxContextMessageCountSlider(props: Props) {
    const { t } = useTranslation()
    const { settingsEdit, setSettingsEdit } = props
    return (
        <Box sx={{ margin: '10px' }}>
            <Box>
                <Typography id="discrete-slider" gutterBottom>
                    {t('Max Message Count in Context')}
                </Typography>
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                }}
            >
                <Box sx={{ width: '92%' }}>
                    <Slider
                        value={settingsEdit.openaiMaxContextMessageCount}
                        onChange={(_event, value) => {
                            const v = Array.isArray(value) ? value[0] : value
                            setSettingsEdit({
                                ...settingsEdit,
                                openaiMaxContextMessageCount: v,
                            })
                        }}
                        aria-labelledby="discrete-slider"
                        valueLabelDisplay="auto"
                        step={2}
                        min={0}
                        max={22}
                        marks
                        valueLabelFormat={(value) => {
                            if (value === 22) {
                                return t('No Limit')
                            }
                            return value
                        }}
                    />
                </Box>
                <TextField
                    sx={{ marginLeft: 2, width: '100px' }}
                    value={
                        settingsEdit.openaiMaxContextMessageCount > 20
                            ? t('No Limit')
                            : settingsEdit.openaiMaxContextMessageCount
                    }
                    onChange={(event) => {
                        const s = event.target.value.trim()
                        const v = parseInt(s)
                        if (isNaN(v)) {
                            return
                        }
                        setSettingsEdit({
                            ...settingsEdit,
                            openaiMaxContextMessageCount: v,
                        })
                    }}
                    type="text"
                    size="small"
                    variant="outlined"
                />
            </Box>
        </Box>
    )
}
