import { Chip, TextField, Slider, Typography, Box } from '@mui/material'
import { ModelSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import PlaylistAddCheckCircleIcon from '@mui/icons-material/PlaylistAddCheckCircle'
import LightbulbCircleIcon from '@mui/icons-material/LightbulbCircle'

export interface Props {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function TemperatureSlider(props: Props) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const handleTemperatureChange = (event: Event, newValue: number | number[], activeThumb: number) => {
        if (typeof newValue === 'number') {
            setSettingsEdit({ ...settingsEdit, temperature: newValue })
        } else {
            setSettingsEdit({
                ...settingsEdit,
                temperature: newValue[activeThumb],
            })
        }
    }
    return (
        <Box sx={{ margin: '10px' }}>
            <Box>
                <Typography id="discrete-slider" gutterBottom>
                    {t('temperature')}
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
                        value={settingsEdit.temperature}
                        onChange={handleTemperatureChange}
                        aria-labelledby="discrete-slider"
                        valueLabelDisplay="auto"
                        defaultValue={settingsEdit.temperature}
                        step={0.1}
                        min={0}
                        max={1}
                        marks={[
                            {
                                value: 0.2,
                                label: (
                                    <Chip
                                        size="small"
                                        icon={<PlaylistAddCheckCircleIcon />}
                                        label={t('meticulous')}
                                        className="opacity-50"
                                    />
                                ),
                            },
                            {
                                value: 0.8,
                                label: (
                                    <Chip
                                        size="small"
                                        icon={<LightbulbCircleIcon />}
                                        label={t('creative')}
                                        className="opacity-50"
                                    />
                                ),
                            },
                        ]}
                    />
                </Box>
                <TextField
                    sx={{ marginLeft: 2, width: '100px' }}
                    value={settingsEdit.temperature}
                    disabled
                    type="text"
                    size="small"
                    variant="outlined"
                />
            </Box>
        </Box>
    )
}
