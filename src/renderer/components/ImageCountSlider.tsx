import { TextField, Slider, Typography, Box } from '@mui/material'
import { SessionSettings } from '../../shared/types'
import { useTranslation } from 'react-i18next'

export interface Props {
    settingsEdit: SessionSettings
    setSettingsEdit: (settings: SessionSettings) => void
}

export default function ImageCountSlider(props: Props) {
    const { t } = useTranslation()
    const { settingsEdit, setSettingsEdit } = props
    return (
        <Box sx={{ margin: '10px' }}>
            <Box>
                <Typography gutterBottom>{t('Number of Images per Reply')}</Typography>
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
                        value={settingsEdit.imageGenerateNum}
                        onChange={(_event, value) => {
                            const v = Array.isArray(value) ? value[0] : value
                            setSettingsEdit({ ...settingsEdit, imageGenerateNum: v })
                        }}
                        aria-labelledby="discrete-slider"
                        valueLabelDisplay="auto"
                        step={1}
                        min={1}
                        max={10}
                        marks
                    />
                </Box>
                <TextField
                    sx={{ marginLeft: 2, width: '100px' }}
                    value={settingsEdit.imageGenerateNum}
                    onChange={(event) => {
                        const s = event.target.value.trim()
                        const v = parseInt(s)
                        if (isNaN(v)) {
                            return
                        }
                        setSettingsEdit({ ...settingsEdit, imageGenerateNum: v })
                    }}
                    type="text"
                    size="small"
                    variant="outlined"
                />
            </Box>
        </Box>
    )
}
