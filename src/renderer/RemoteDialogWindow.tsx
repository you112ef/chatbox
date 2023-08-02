import React from 'react'
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    DialogContentText,
    TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import * as remote from './remote'
import { getDefaultStore } from 'jotai'
import * as api from './api'
import { settingsAtom } from './stores/atoms'
import { getConfig } from './storage'
import md from './markdown'

const { useEffect, useState } = React

export default function RemoteDialogWindow() {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [dialogConfig, setDialogConfig] = useState<remote.DialogConfig | null>(null)

    const store = getDefaultStore()
    useEffect(() => {
        ;(async () => {
            const config = await getConfig()
            const settings = store.get(settingsAtom)
            const version = await api.getVersion()
            try {
                const dialog = await remote.getDialogConfig({
                    uuid: config.uuid,
                    language: settings.language,
                    version: version,
                })
                setDialogConfig(dialog)
                if (dialog) {
                    setOpen(true)
                }
            } catch (e) {
                console.log(e)
            }
        })()
    }, [])

    const onClose = (event?: any, reason?: 'backdropClick' | 'escapeKeyDown') => {
        if (reason === 'backdropClick') {
            return
        }
        setOpen(false)
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogContent>
                <DialogContentText>
                    <Box
                        sx={{
                            wordBreak: 'break-word',
                            wordWrap: 'break-word',
                        }}
                        dangerouslySetInnerHTML={{
                            __html: md.render(dialogConfig?.markdown || ''),
                        }}
                    />
                    <Box>
                        {dialogConfig?.buttons.map((button, index) => (
                            <Button onClick={() => api.openLink(button.url)}>{button.label}</Button>
                        ))}
                    </Box>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose()}>{t('cancel')}</Button>
            </DialogActions>
        </Dialog>
    )
}
