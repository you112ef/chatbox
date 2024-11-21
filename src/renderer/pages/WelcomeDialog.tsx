import { Box, Button, Paper, Dialog, DialogContent } from '@mui/material'
import icon from '../static/icon.png'
import { useTranslation } from 'react-i18next'
import { AllowReportingAndTrackingCheckbox } from './SettingDialog/AdvancedSettingTab'
import LinkTargetBlank from '@/components/Link'
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
                <Box sx={{ textAlign: 'center', padding: '0 20px' }}>
                    <img src={icon} style={{ width: '80px', margin: 0, display: 'inline-block' }} />
                    <h3 style={{ margin: '4px 0 5px 0' }}>Chatbox</h3>
                    <p className="p-0 m-0">{t('An easy-to-use AI client app')}</p>
                    {/* <p className="p-0 m-0">{t('about-slogan')}</p> */}
                    <div className="p-0 m-0 opacity-60 text-xs text-left">
                        <ul className="mb-8 px-6 opacity-90">
                            <li>{t('Supports a variety of advanced AI models')}</li>
                            <li>{t('All data is stored locally, ensuring privacy and rapid access')}</li>
                            <li>{t('Ideal for both work and educational scenarios')}</li>
                        </ul>
                    </div>
                </Box>
                <Paper
                    elevation={2}
                    className="font-light text-sm mb-1 py-2 px-4 text-center"
                    sx={{
                        backgroundColor: 'paper',
                    }}
                >
                    <div className="">
                        <b className="">{t('Select and configure an AI model provider')}</b>
                    </div>
                    <div className="my-2">
                        <Button
                            variant="contained"
                            sx={{ fontSize: '18px', fontWeight: 'bold' }}
                            onClick={() => {
                                onClose()
                                onSetup()
                            }}
                        >
                            {t('Start Setup')}
                        </Button>
                    </div>
                    <div>
                        <AllowReportingAndTrackingCheckbox className="opacity-75 text-xs" />
                    </div>
                </Paper>
                <div className="text-center mt-4 text-xs">
                    <LinkTargetBlank href="https://chatboxai.app/privacy" className="mx-2">
                        Privacy Policy
                    </LinkTargetBlank>
                    <LinkTargetBlank href="https://chatboxai.app/terms" className="mx-2">
                        User Terms
                    </LinkTargetBlank>
                </div>
            </DialogContent>
        </Dialog>
    )
}
