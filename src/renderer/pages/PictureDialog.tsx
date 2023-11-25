import { Button, Dialog, DialogContent, DialogActions, DialogTitle } from '@mui/material'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useAtom } from 'jotai'
import ImageInStorage from '@/components/ImageInStorage'
import * as runtime from '@/packages/runtime'
import storage from '@/storage'
import SaveIcon from '@mui/icons-material/Save'

interface Props {}

export default function PictureDialog(props: Props) {
    const { t } = useTranslation()
    const [pictureShowStorageKey, setPictureShowStorageKey] = useAtom(atoms.pictureShowStorageKeyAtom)

    const onClose = () => setPictureShowStorageKey(null)
    const onExport = async () => {
        if (!pictureShowStorageKey) {
            return
        }
        const base64 = await storage.getBlob<string>(pictureShowStorageKey)
        if (!base64) {
            return
        }
        runtime.exportPngFile('export.png', base64)
    }

    return (
        <Dialog open={!!pictureShowStorageKey} onClose={onClose} fullWidth classes={{ paper: 'h-4/5' }}>
            <DialogTitle></DialogTitle>
            <DialogContent>
                <div className="w-full h-full text-center">
                    {pictureShowStorageKey && <ImageInStorage storageKey={pictureShowStorageKey} />}
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onExport} startIcon={<SaveIcon />}>
                    {t('save')}
                </Button>
                <Button onClick={onClose}>{t('close')}</Button>
            </DialogActions>
        </Dialog>
    )
}
