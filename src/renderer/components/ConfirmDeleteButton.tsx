import { useState } from 'react'
import { MenuItem } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

interface ConfirmDeleteButtonProps {
    onDelete: () => void
}

export default function ConfirmDeleteButton({
    onDelete
}: ConfirmDeleteButtonProps) {
    const theme = useTheme()
    const { t } = useTranslation()
    const [confirmDelete, setConfirmDelete] = useState(false)
    return confirmDelete ? (
        <MenuItem
            disableRipple
            onClick={() => {
                onDelete()
                setConfirmDelete(false)
            }}
            sx={{
                color: theme.palette.error.contrastText,
                backgroundColor: theme.palette.error.main,
                '&:hover': {
                    color: theme.palette.error.contrastText,
                    backgroundColor: theme.palette.error.main,
                },
            }}
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
            sx={{
                '&:hover': {
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                },
            }}
        >
            <DeleteIcon fontSize="small" />
            {t('delete')}
        </MenuItem>
    )
} 