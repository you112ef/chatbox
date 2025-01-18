import { Box, Button, Paper, Dialog, DialogContent } from '@mui/material'
import icon from '../static/icon.png'
import { useTranslation } from 'react-i18next'
import { useAtom, useSetAtom } from 'jotai'
import * as atoms from '@/stores/atoms'

export default function WelcomeDialog(props: {}) {
    const { t } = useTranslation()
    const [open, setOpen] = useAtom(atoms.openWelcomeDialogAtom)
    const setOpenSettingWindow = useSetAtom(atoms.openSettingDialogAtom)

    const onClose = () => {
        setOpen(false)
    }
    const onSetup = () => {
        setOpenSettingWindow('ai')
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs">
            <DialogContent>
                <Box sx={{ textAlign: 'center', padding: '12px 24px' }}>
                    <img src={icon} style={{ width: '64px', margin: '0 auto 8px', display: 'block' }} />
                    <h2 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>Chatbox</h2>
                    <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">{t('An easy-to-use AI client app')}</p>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                        <ul className="list-none p-0 m-0 space-y-1.5">
                            <li className="flex items-center">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                                <span className="text-left">{t('Supports a variety of advanced AI models')}</span>
                            </li>
                            <li className="flex items-center">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                                <span className="text-left">{t('All data is stored locally, ensuring privacy and rapid access')}</span>
                            </li>
                            <li className="flex items-center">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                                <span className="text-left">{t('Ideal for both work and educational scenarios')}</span>
                            </li>
                        </ul>
                    </div>
                </Box>
                <Paper
                    elevation={2}
                    className="mx-4 mb-2 mt-4 p-3 text-center rounded-lg"
                    sx={{
                        backgroundColor: 'paper',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                >
                    <div className="mb-2">
                        <h3 className="text-base font-medium m-0 text-gray-800 dark:text-gray-100">
                            {t('Select and configure an AI model provider')}
                        </h3>
                    </div>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{
                            fontSize: '14px',
                            fontWeight: 600,
                            padding: '6px',
                            borderRadius: '6px',
                            textTransform: 'none',
                            boxShadow: 'none'
                        }}
                        onClick={() => {
                            onClose()
                            onSetup()
                        }}
                    >
                        {t('Start Setup')}
                    </Button>
                </Paper>
            </DialogContent>
        </Dialog>
    )
}
