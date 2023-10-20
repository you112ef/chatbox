import React from 'react'
import { Box, Button, Dialog, DialogContent, DialogActions, DialogContentText } from '@mui/material'
import { useTranslation } from 'react-i18next'
import * as remote from '../packages/remote'
import { getDefaultStore } from 'jotai'
import * as api from '../packages/runtime'
import { settingsAtom } from '../stores/atoms'
import storage from '../storage'
import Markdown from '@/components/Markdown'

const { useEffect, useState } = React

export default function RemoteDialogWindow() {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [dialogConfig, setDialogConfig] = useState<remote.DialogConfig | null>(null)

    const store = getDefaultStore()
    useEffect(() => {
        ;(async () => {
            const config = await storage.getConfig()
            const settings = store.get(settingsAtom)
            const version = await api.getVersion()
            if (version === '0.0.1') {
                return // 本地开发环境不显示远程弹窗
            }
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
    useEffect(() => {
        if (open) {
            window.gtag('event', 'screen_view', { screen_name: 'remote_dialog_window' })
        }
    }, [open])

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
                    <Markdown>{dialogConfig?.markdown || ''}</Markdown>
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
