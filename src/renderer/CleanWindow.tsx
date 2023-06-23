import {
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    DialogContentText,
} from '@mui/material';
import { Session } from './types';
import { useTranslation } from 'react-i18next';
import * as atoms from './stores/atoms';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

interface Props {
    open: boolean;
    close(): void;
}

export default function CleanWindow(props: Props) {
    const [currentMessages, setCurrentMessages] = useAtom(
        atoms.currentMessagesAtom
    );
    const currentSessionName = useAtomValue(atoms.currentSessionNameAtom);
    const { t } = useTranslation();
    const clean = () => {
        currentMessages.forEach((msg) => {
            msg?.cancel?.();
        });
        setCurrentMessages((msgs) =>
            msgs.filter((msg) => msg.role === 'system')
        );
        props.close();
    };
    return (
        <Dialog open={props.open} onClose={props.close}>
            <DialogTitle>{t('clean')}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {t('delete confirmation', {
                        sessionName: currentSessionName,
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
    );
}
