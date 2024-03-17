import { Button, Dialog, DialogContent, DialogActions, DialogTitle } from '@mui/material'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useAtom } from 'jotai'
import { ImageInStorage, Image } from '@/components/Image'
import storage from '@/storage'
import SaveIcon from '@mui/icons-material/Save'
import platform from '@/platform'

interface Props { }

export default function PictureDialog(props: Props) {
    const { t } = useTranslation()
    const [pictureShow, setPictureShow] = useAtom(atoms.pictureShowAtom)

    const onClose = () => setPictureShow(null)
    const onExport = async () => {
        if (!pictureShow) {
            return
        }
        if (pictureShow.storageKey) {
            const base64 = await storage.getBlob(pictureShow.storageKey)
            if (!base64) {
                return
            }
            platform.exporter.exportImageFile('export', base64)
        }
        if (pictureShow.url) {
            platform.exporter.exportByUrl('export.png', pictureShow.url)
        }
    }

    return (
        <Dialog open={!!pictureShow} onClose={onClose} fullWidth >
            <DialogTitle></DialogTitle>
            <DialogContent>
                <div className="w-full h-full text-center">
                    {pictureShow?.storageKey && <ImageInStorage storageKey={pictureShow.storageKey} className='h-full w-full' /> }
                    {pictureShow?.url && <Image src={pictureShow.url} className='h-full w-full' />}
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
