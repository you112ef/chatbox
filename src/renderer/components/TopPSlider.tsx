import { useEffect, useState } from 'react'
import { TextField, Slider, Typography, Box } from '@mui/material'
import { SessionSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'

export interface Props {
    settingsEdit: SessionSettings
    setSettingsEdit: (settings: SessionSettings) => void
}

export default function TopPSlider(props: Props) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const [input, setInput] = useState('1')
    useEffect(() => {
        setInput(`${settingsEdit.topP}`)
    }, [settingsEdit.topP])
    const handleChange = (event: Event, newValue: number | number[], activeThumb: number) => {
        if (typeof newValue === 'number') {
            setSettingsEdit({ ...settingsEdit, topP: newValue })
        } else {
            setSettingsEdit({
                ...settingsEdit,
                topP: newValue[activeThumb],
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
            setInput(`${settingsEdit.topP}`)
            return
        }
        if (num < 0 || num > 1) {
            setInput(`${settingsEdit.topP}`)
            return
        }
        // 保留一位小数
        num = Math.round(num * 100) / 100
        setInput(num.toString())
        setSettingsEdit({ ...settingsEdit, topP: num })
    }
    return (
        <Box sx={{ margin: '10px' }}>
            <Box>
                <Typography id="discrete-slider" gutterBottom>
                    {t('Top P')}
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
                        value={settingsEdit.topP}
                        onChange={handleChange}
                        aria-labelledby="discrete-slider"
                        valueLabelDisplay="auto"
                        defaultValue={settingsEdit.topP}
                        step={0.01}
                        min={0}
                        max={1}
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
