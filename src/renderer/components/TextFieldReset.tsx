import React from 'react'
import { TextField, InputAdornment, IconButton } from '@mui/material'
import BackspaceIcon from '@mui/icons-material/Backspace'

export default function TextFieldReset(props: {
    label: string
    value: string
    setValue: (value: string) => void
    placeholder?: string
    disabled?: boolean
    autoFocus?: boolean
    helperText?: React.ReactNode
}) {
    const handleReset = () => props.setValue('')
    const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
    }
    return (
        <TextField
            type="text"
            margin="dense"
            label={props.label}
            fullWidth
            autoFocus={props.autoFocus}
            variant="outlined"
            placeholder={props.placeholder}
            disabled={props.disabled}
            value={props.value}
            onChange={(e) => props.setValue(e.target.value.trim())}
            InputProps={{
                endAdornment:
                    props.value === '' ? null : (
                        <InputAdornment position="end">
                            <IconButton aria-label="reset value" onClick={handleReset} onMouseDown={handleMouseDown}>
                                <BackspaceIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
            }}
            helperText={props.helperText}
        />
    )
}
