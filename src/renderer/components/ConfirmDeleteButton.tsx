import { useState } from 'react'
import { MenuItem } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import { SxProps, useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

interface Props {
    onDelete: () => void
    label?: string | null | undefined
    color?: 'error' | 'warning'
}

export default function ConfirmDeleteButton({
    onDelete,
    label,
    color = 'error',
}: Props) {
    const theme = useTheme()
    const { t } = useTranslation()
    const [confirmDelete, setConfirmDelete] = useState(false)

    const confirmStyleHash: Record<NonNullable<Props['color']>, SxProps> = {
        error: {
            color: theme.palette.error.contrastText,
            backgroundColor: theme.palette.error.main,
            '&:hover': {
                color: theme.palette.error.contrastText,
                backgroundColor: theme.palette.error.main,
            },
        },
        warning: {
            color: theme.palette.warning.contrastText,
            backgroundColor: theme.palette.warning.main,
            '&:hover': {
                color: theme.palette.warning.contrastText,
                backgroundColor: theme.palette.warning.main,
            },
        },
    }
    const hoverStyleHash: Record<NonNullable<Props['color']>, SxProps> = {
        error: {
            '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
            },
        },
        warning: {
            '&:hover': {
                backgroundColor: 'rgba(255, 165, 0, 0.1)',
            },
        },
    }

    return confirmDelete ? (
        <MenuItem
            disableRipple
            onClick={() => {
                onDelete()
                setConfirmDelete(false)
            }}
            sx={confirmStyleHash[color]}
        >
            <CheckIcon fontSize="small" />
            <b>{t('Confirm?')}</b>
        </MenuItem>
    ) : (
        <MenuItem
            disableRipple
            onClick={() => {
                setConfirmDelete(true)
            }}
            sx={hoverStyleHash[color]}
        >
            <DeleteIcon fontSize="small" />
            {label || t('delete')}
        </MenuItem>
    )
} 