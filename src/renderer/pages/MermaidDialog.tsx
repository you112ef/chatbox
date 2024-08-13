import { Button, Dialog, DialogContent, DialogActions, DialogTitle, Tabs, Tab } from '@mui/material'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useAtom, useAtomValue } from 'jotai'
import { Mermaid } from '@/components/Mermaid'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { useEffect, useState } from 'react'
import { CodeBlock } from '@/components/Markdown'
import VisibilityIcon from '@mui/icons-material/Visibility';
import CodeIcon from '@mui/icons-material/Code';
import { cn } from '@/lib/utils'
import mermaid from 'mermaid'
import SaveIcon from '@mui/icons-material/Save'
import platform from '@/platform'

export default function MermaidDialog(props: {}) {
    const { t } = useTranslation()
    const [source, setSource] = useAtom(atoms.mermaidDialogSourceAtom)
    const theme = useAtomValue(atoms.realThemeAtom)
    const [tab, setTab] = useState(0)

    useEffect(() => {
        setTab(0)
    }, [source])

    const onClose = () => {
        setSource('')
    }
    const handleChangeTab = (event: React.ChangeEvent<{}>, newValue: number) => {
        setTab(newValue)
    }
    const handleExport = async () => {
        const { svg } = await mermaid.render('tmp-mermaid-svg', source)
        const blob = new Blob([svg], {type: 'image/svg+xml'});
        const basename = `export_${Math.random().toString(36).substring(7)}`
        await platform.exporter.exportBlob(`${basename}.svg`, blob, 'utf8')
    }

    return (
        <Dialog open={!!source} onClose={onClose} fullWidth
            maxWidth='md'
            classes={{ paper: 'h-4/5' }}
        >
            <DialogTitle>{t('Preview')}</DialogTitle>
            <DialogContent style={{ padding: '0', margin: '0' }} >
                <Tabs value={tab} onChange={handleChangeTab}>
                    <Tab icon={<VisibilityIcon />} />
                    <Tab icon={<CodeIcon />} />
                </Tabs>
                <div
                    role="tabpanel"
                    className={cn(
                        "w-full h-full text-center bg-stone-400/10 dark:bg-blue-400/10",
                        tab !== 0 ? "hidden" : "",
                    )}
                >
                    <TransformWrapper>
                        <TransformComponent
                            wrapperClass='w-full h-full'
                            contentClass='w-full h-full flex items-center justify-center'
                        >
                            <div className="w-full h-full flex items-center justify-center">
                                <Mermaid source={source} theme={theme}
                                    className='max-w-full max-h-full w-auto h-auto object-contain'
                                />
                            </div>
                        </TransformComponent>
                    </TransformWrapper>
                </div>
                <div
                    role="tabpanel"
                    className={cn(
                        "p-2 md:p-6",
                        tab !== 1 ? "hidden" : "",
                    )}
                >
                    <CodeBlock className={`language-mermaid`}>
                        {source}
                    </CodeBlock>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleExport} startIcon={<SaveIcon />}>
                    {t('save')}
                </Button>
                <Button onClick={onClose}>{t('close')}</Button>
            </DialogActions>
        </Dialog>
    )
}