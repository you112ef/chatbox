import { Button, Paper, Badge, Box, Dialog, DialogContent, DialogActions, DialogTitle, useTheme } from '@mui/material'
import iconPNG from '../static/icon.png'
import { useTranslation } from 'react-i18next'
import platform from '../platform'
import * as i18n from '../i18n'
import useVersion from '../hooks/useVersion'
import * as atoms from '../stores/atoms'
import { useAtom, useAtomValue } from 'jotai'
import Markdown from '@/components/Markdown'
import LinkTargetBlank from '@/components/Link'

export default function AboutWindow(props: {}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [open, setOpen] = useAtom(atoms.openAboutDialogAtom)
  const language = useAtomValue(atoms.languageAtom)
  const versionHook = useVersion()
  // const [sponsorBanners, setSponsorBanners] = useState<SponsorAboutBanner[]>([])
  // useEffect(() => {
  //     if (open) {
  //         remote.listSponsorAboutBanner().then(setSponsorBanners)
  //         trackingEvent('about_window', { event_category: 'screen_view' })
  //     } else {
  //         setSponsorBanners([])
  //     }
  // }, [open])
  const handleClose = () => {
    setOpen(false)
  }
  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle>{t('About Chatbox')}</DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', padding: '0 20px' }}>
          <img src={iconPNG} style={{ width: '100px', margin: 0, display: 'inline-block' }} />
          <h3 style={{ margin: '4px 0 5px 0' }}>
            Chatbox
            {/\d/.test(versionHook.version) ? `(v${versionHook.version})` : ''}
          </h3>
          <p className="p-0 m-0">{t('about-slogan')}</p>
          <p className="p-0 m-0 opacity-60 text-xs">{t('about-introduction')}</p>
          <p className="p-0 m-0 text-center text-xs opacity-70">
            <LinkTargetBlank
              href="https://chatboxai.app/privacy"
              className="mx-2 no-underline hover:underline"
              style={{ color: theme.palette.text.primary }}
            >
              Privacy Policy
            </LinkTargetBlank>
            <LinkTargetBlank
              href="https://chatboxai.app/terms"
              className="mx-2 no-underline hover:underline"
              style={{ color: theme.palette.text.primary }}
            >
              User Terms
            </LinkTargetBlank>
          </p>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
          className="mt-1 mb-4"
        >
          <Badge color="primary" variant="dot" invisible={!versionHook.needCheckUpdate} sx={{ margin: '4px' }}>
            <Button
              variant="outlined"
              onClick={() => platform.openLink(`https://chatboxai.app/redirect_app/check_update/${language}`)}
            >
              {t('Check Update')}
            </Button>
          </Badge>
          <Button
            variant="outlined"
            sx={{ margin: '4px' }}
            onClick={() => platform.openLink(`https://chatboxai.app/redirect_app/homepage/${language}`)}
          >
            {t('Homepage')}
          </Button>
          <Button
            variant="outlined"
            sx={{ margin: '4px' }}
            onClick={() => platform.openLink(`https://chatboxai.app/redirect_app/feedback/${language}`)}
          >
            {t('Feedback')}
          </Button>
          <Button
            variant="outlined"
            sx={{ margin: '4px' }}
            onClick={() => platform.openLink(`https://chatboxai.app/redirect_app/faqs/${language}`)}
          >
            {t('FAQs')}
          </Button>
        </Box>
        <Box>
          <h4 className="text-center mb-1 mt-2">{t('Changelog')}</h4>
          <Box className="px-6">
            <Markdown>{i18n.changelog()}</Markdown>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('close')}</Button>
      </DialogActions>
    </Dialog>
  )
}
