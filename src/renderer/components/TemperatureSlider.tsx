import { useEffect, useState } from 'react'
import { Chip, TextField, Slider, Typography, Box } from '@mui/material'
import { SessionSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import PlaylistAddCheckCircleIcon from '@mui/icons-material/PlaylistAddCheckCircle'
import LightbulbCircleIcon from '@mui/icons-material/LightbulbCircle'

export interface Props {
    settingsEdit: SessionSettings
    setSettingsEdit: (settings: SessionSettings) => void
}

export default function TemperatureSlider(props: Props) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const [input, setInput] = useState('0.7')
    useEffect(() => {
        setInput(`${settingsEdit.temperature}`)
    }, [settingsEdit.temperature])
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
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        if (value === '' || value.endsWith('.')) {
            setInput(value)
            return
        }
        let num = parseFloat(value)
        if (isNaN(num)) {
            setInput(`${settingsEdit.temperature}`)
            return
        }
        if (num < 0 || num > 1) {
            setInput(`${settingsEdit.temperature}`)
            return
        }
        // 保留一位小数
        num = Math.round(num * 10) / 10
        setInput(num.toString())
        setSettingsEdit({ ...settingsEdit, temperature: num })
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
                    value={input}
                    onChange={handleInputChange}
                    type="text"
                    size="small"
                    variant="outlined"
                />
            </Box>
        </Box>
    )
}
