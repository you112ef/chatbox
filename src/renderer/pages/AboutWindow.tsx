import React, { useEffect, useState } from 'react'
import {
    Button,
    Paper,
    Badge,
    Box,
    Divider,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    Stack,
} from '@mui/material'
import iconPNG from '../static/icon.png'
import { Trans, useTranslation } from 'react-i18next'
import * as api from '../packages/runtime'
import * as remote from '../packages/remote'
import { SponsorAboutBanner } from '../../shared/types'
import * as i18n from '../i18n'
import md from '../packages/markdown'
import useVersion from '../hooks/useVersion'
import * as atoms from '../stores/atoms'
import { useAtomValue } from 'jotai'

interface Props {
    open: boolean
    close(): void
}

export default function AboutWindow(props: Props) {
    const { t } = useTranslation()
    const language = useAtomValue(atoms.languageAtom)
    const versionHook = useVersion()
    const [sponsorBanners, setSponsorBanners] = useState<SponsorAboutBanner[]>([])
    useEffect(() => {
        if (props.open) {
            remote.listSponsorAboutBanner().then(setSponsorBanners)
        } else {
            setSponsorBanners([])
        }
    }, [props.open])
    return (
        <Dialog open={props.open} onClose={props.close} fullWidth>
            <DialogTitle>{t('About Chatbox')}</DialogTitle>
            <DialogContent>
                <Box sx={{ textAlign: 'center', padding: '0 20px' }}>
                    <img src={iconPNG} style={{ width: '100px', margin: 0, display: 'inline-block' }} />
                    <h3 style={{ margin: '4px 0 5px 0' }}>Chatbox(v{versionHook.version})</h3>
                    <p className="p-0 m-0">{t('about-slogan')}</p>
                    <p className="p-0 m-0 opacity-60 text-xs">{t('about-introduction')}</p>
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        marginTop: '10px',
                    }}
                >
                    <Badge color="primary" variant="dot" invisible={!versionHook.needCheckUpdate}>
                        <Button
                            variant="outlined"
                            onClick={() => api.openLink(`https://chatboxai.app/redirect_app/check_update/${language}`)}
                        >
                            {t('Check Update')}
                        </Button>
                    </Badge>
                    <Button
                        variant="outlined"
                        onClick={() => api.openLink(`https://chatboxai.app/redirect_app/homepage/${language}`)}
                    >
                        {t('Homepage')}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => api.openLink(`https://chatboxai.app/redirect_app/feedback/${language}`)}
                    >
                        {t('Feedback')}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => api.openLink(`https://chatboxai.app/redirect_app/faqs/${language}`)}
                    >
                        {t('FAQs')}
                    </Button>
                </Box>
                <h4 className="text-center mb-1 mt-8 font-medium">
                    <Trans
                        i18nKey="about-author"
                        components={[
                            <a
                                className="font-bold"
                                href={`https://chatboxai.app/redirect_app/author/${language}`}
                                target="_blank"
                                rel="noreferrer"
                            />,
                        ]}
                    />
                </h4>
                <Paper
                    elevation={2}
                    className="font-light text-sm"
                    sx={{
                        padding: '10px 10px 5px 10px',
                        backgroundColor: 'paper',
                    }}
                >
                    <span>{t('Auther Message')}</span>
                    <Stack spacing={2} direction="row">
                        <Button
                            variant="text"
                            onClick={() => api.openLink(`https://chatboxai.app/redirect_app/donate/${language}`)}
                        >
                            {t('Donate')}
                        </Button>
                        <Button
                            variant="text"
                            onClick={() =>
                                api.openLink(`https://chatboxai.app/redirect_app/become_sponsor/${language}`)
                            }
                        >
                            {t('Or become a sponsor')}
                        </Button>
                    </Stack>
                </Paper>

                {sponsorBanners.length > 0 && (
                    <Divider sx={{ margin: '10px 0 5px 0', opacity: 0.8 }}>
                        {t('Special thanks to the following sponsors:')}
                    </Divider>
                )}
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        '& > :not(style)': {
                            m: 1,
                        },
                        justifyContent: 'center',
                        opacity: 0.8,
                    }}
                >
                    {sponsorBanners.map((item) => {
                        return (
                            <Paper
                                key={item.name}
                                elevation={1}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexDirection: 'column',
                                    textAlign: 'center',
                                    autoflowY: 'auto',
                                    width: '100%',
                                    height: '128px',
                                }}
                            >
                                {item.type === 'picture' ? (
                                    <>
                                        <a href={item.link} target="_blank">
                                            <img
                                                style={{
                                                    maxWidth: '90%',
                                                    maxHeight: '100px',
                                                }}
                                                src={item.pictureUrl}
                                            />
                                        </a>
                                    </>
                                ) : (
                                    <>
                                        <a href={item.link} target="_blank">
                                            <img style={{ maxWidth: '140px' }} src={item.pictureUrl} />
                                        </a>
                                        <a href={item.link} target="_blank">
                                            <b>{item.title}</b>
                                        </a>
                                        <a href={item.link} target="_blank">
                                            <span>{item.description}</span>
                                        </a>
                                    </>
                                )}
                            </Paper>
                        )
                    })}
                </Box>
                <Box>
                    <h4 className="text-center mb-1 mt-8">{t('Changelog')}</h4>
                    <Box className="px-6" dangerouslySetInnerHTML={{ __html: md.render(i18n.changelog()) }} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.close}>{t('close')}</Button>
            </DialogActions>
        </Dialog>
    )
}
