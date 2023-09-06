import { Button, Dialog, DialogContent, DialogActions, DialogTitle, DialogContentText } from '@mui/material'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import * as sessionActions from '../stores/sessionActions'

interface Props {
    open: boolean
    close(): void
}

// 清空会话窗口
export default function CleanWindow(props: Props) {
    const currentSession = useAtomValue(atoms.currentSessionAtom)
    const { t } = useTranslation()
    const clean = () => {
        currentSession.messages.forEach((msg) => {
            msg?.cancel?.()
        })
        sessionActions.clear(currentSession.id)
        window.gtag('event', 'clear_conversation', { event_category: 'user' })
        props.close()
    }
    return (
        <Dialog open={props.open} onClose={props.close}>
            <DialogTitle>{t('clean')}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {t('delete confirmation', {
                        sessionName: currentSession.name,
                    })}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.close}>{t('cancel')}</Button>
                <Button onClick={clean} color="error">
                    {t('clean it up')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
