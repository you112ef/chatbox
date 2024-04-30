import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import * as React from 'react'

export interface Props<T extends string> {
    label: string
    value: T
    options: { value: T; label: React.ReactNode }[]
    onChange: (value: T) => void
    className?: string
}

export default function SimpleSelect<T extends string>(props: Props<T>) {
    return (
        <FormControl fullWidth variant="outlined" margin="dense" className={props.className}>
            <InputLabel>{props.label}</InputLabel>
            <Select label={props.label} value={props.value} onChange={(e) => props.onChange(e.target.value as T)}>
                {props.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}
