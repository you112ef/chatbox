import { Button, Dialog, DialogContent, DialogActions, DialogTitle } from '@mui/material'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useAtom } from 'jotai'
import { ImageInStorage, Img } from '@/components/Image'
import storage from '@/storage'
import SaveIcon from '@mui/icons-material/Save'
import platform from '@/platform'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { useIsSmallScreen } from '@/hooks/useScreenChange'

export default function PictureDialog(props: {}) {
    const { t } = useTranslation()
    const [pictureShow, setPictureShow] = useAtom(atoms.pictureShowAtom)
    const isSmallScreen = useIsSmallScreen()

    if (!pictureShow) {
        return null
    }
    const { picture, ExtraButtons, onSave } = pictureShow

    const onClose = () => setPictureShow(null)
    const onSaveDefault = async () => {
        if (!picture) {
            return
        }
        const basename = `export_${Math.random().toString(36).substring(7)}`
        if (picture.storageKey) {
            const base64 = await storage.getBlob(picture.storageKey)
            if (!base64) {
                return
            }
            platform.exporter.exportImageFile(basename, base64)
        }
        if (picture.url) {
            if (picture.url.startsWith('data:image')) {
                platform.exporter.exportImageFile(basename, picture.url)
                return
            }
            platform.exporter.exportByUrl(`${basename}.png`, picture.url)
        }
    }
    return (
        <Dialog open={!!picture} onClose={onClose}
            fullWidth
            maxWidth="lg"
            classes={{
                paper: isSmallScreen ? '' : 'h-full max-h-[80vh]',
            }}
        >
            <DialogTitle></DialogTitle>
            <DialogContent style={{ padding: '0', margin: '0' }}>
                <div className="w-full h-full text-center">
                    <TransformWrapper
                        initialScale={1}
                        initialPositionX={0}
                        initialPositionY={0}
                    >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <>
                                <TransformComponent
                                    wrapperClass='w-full h-full'
                                    contentClass='w-full h-full flex items-center justify-center'
                                >
                                    <div className="w-full h-full flex items-center justify-center">
                                        {picture?.storageKey && <ImageInStorage storageKey={picture.storageKey} className='max-w-full max-h-full w-auto h-auto object-contain' />}
                                        {picture?.url && <Img src={picture.url} className='max-w-full max-h-full w-auto h-auto object-contain' />}
                                    </div>
                                </TransformComponent>
                            </>
                        )}
                    </TransformWrapper>
                </div>
            </DialogContent>
            <DialogActions>
                {ExtraButtons}
                <Button onClick={onSave || onSaveDefault} startIcon={<SaveIcon />}>
                    {t('save')}
                </Button>
                <Button onClick={onClose}>{t('close')}</Button>
            </DialogActions>
        </Dialog>
    )
}
