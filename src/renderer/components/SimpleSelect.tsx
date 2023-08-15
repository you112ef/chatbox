import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'

export interface Props<T extends string> {
    label: string
    value: T
    options: T[]
    onChange: (value: T) => void
}

export default function SimpleSelect<T extends string>(props: Props<T>) {
    const { label, value, options, onChange } = props
    return (
        <FormControl fullWidth variant="outlined" margin="dense">
            <InputLabel>{label}</InputLabel>
            <Select label={label} value={value} onChange={(e) => onChange(e.target.value as T)}>
                {options.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}
