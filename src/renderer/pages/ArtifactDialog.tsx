import { Button, Dialog, DialogContent, DialogActions, DialogTitle } from '@mui/material'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useAtom } from 'jotai'
import { Artifact } from '@/components/Artifact'
import { useState } from 'react'

export default function ArtifactDialog(props: {}) {
    const { t } = useTranslation()
    const [htmlCode, setHtmlCode] = useAtom(atoms.artifactDialogHtmlCodeAtom)
    const [reloadSign, setReloadSign] = useState(0)

    const onReload = () => {
        setReloadSign(Math.random())
    }
    const onClose = () => {
        setHtmlCode('')
    }

    return (
        <Dialog open={!!htmlCode} onClose={onClose} fullWidth
            maxWidth='md' classes={{ paper: 'h-4/5' }}
        >
            <DialogTitle>{t('Preview')}</DialogTitle>
            <DialogContent style={{ padding: '0', margin: '0' }}>
                <Artifact
                    htmlCode={htmlCode}
                    reloadSign={reloadSign}
                    className='h-[96%]'
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onReload}>{t('Refresh')}</Button>
                <Button onClick={onClose}>{t('close')}</Button>
            </DialogActions>
        </Dialog>
    )
}
