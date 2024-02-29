import { ChangeEvent, useEffect, useState } from 'react'
import { Input, Button, Dialog, DialogContent, DialogActions, DialogTitle, DialogContentText } from '@mui/material'
import { useTranslation, Trans } from 'react-i18next'
import * as sessionActions from '../stores/sessionActions'
import { trackingEvent } from '@/packages/event'

interface Props {
    open: boolean
    close(): void
}

export default function ClearConversationListWindow(props: Props) {
    const { t } = useTranslation()

    const [value, setValue] = useState(100)
    const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
        const int = parseInt(event.target.value || '0')
        if (int >= 0) {
            setValue(int)
        }
    }
    useEffect(() => {
        setValue(100)
        if (props.open) {
            trackingEvent('clear_conversation_list_window', { event_category: 'screen_view' })
        }
    }, [props.open])

    const clean = () => {
        sessionActions.clearConversationList(value)
        trackingEvent('clear_conversation_list', { event_category: 'user' })
        props.close()
    }
    return (
        <Dialog open={props.open} onClose={props.close}>
            <DialogTitle>{t('Clear Conversation List')}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    <Trans
                        i18nKey="Keep only the Top N Conversations in List and Permanently Delete the Rest"
                        values={{ n: value }}
                        components={[
                            <Input
                                value={value}
                                onChange={handleInput}
                                className="w-14"
                                inputProps={{ style: { textAlign: 'center' } }}
                            />,
                        ]}
                    />
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
