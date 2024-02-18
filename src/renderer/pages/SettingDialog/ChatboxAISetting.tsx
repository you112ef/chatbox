import { Tooltip, Button, ButtonGroup, Card, Typography, Box } from '@mui/material'
import { ChatboxAILicenseDetail, ModelSettings } from '../../../shared/types'
import { Trans, useTranslation } from 'react-i18next'
import * as runtime from '../../packages/runtime'
import { usePremium } from '../../hooks/usePremium'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import PasswordTextField from '../../components/PasswordTextField'
import ChatboxAIModelSelect from '../../components/ChatboxAIModelSelect'
import { CHATBOX_BUILD_TARGET } from '@/variables'
import LinearProgress, { LinearProgressProps, linearProgressClasses } from '@mui/material/LinearProgress';
import { styled } from '@mui/material/styles';
import { Accordion, AccordionSummary, AccordionDetails } from '../../components/Accordion'
import { useState } from 'react'
import * as remote from '@/packages/remote'
import CircularProgress from '@mui/material/CircularProgress';

interface ModelConfigProps {
    settingsEdit: ModelSettings
    setSettingsEdit: (settings: ModelSettings) => void
}

export default function ChatboxAISetting(props: ModelConfigProps) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const premium = usePremium()
    return (
        <Box>
            <Box>
                <PasswordTextField
                    label={t('Chatbox AI License')}
                    value={settingsEdit.licenseKey || ''}
                    setValue={(value) => {
                        setSettingsEdit({ ...settingsEdit, licenseKey: value })
                    }}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                    disabled={premium.premiumActivated || premium.premiumIsLoading}
                    helperText={
                        <>
                            <span style={{ color: 'green' }}>{premium.premiumActivated ? t('License Activated') : ''}</span>
                            {
                                !premium.premiumIsLoading && !premium.premiumActivated && premium.reachedActivationLimit && (
                                    <Box className='text-red-500'>
                                        <Trans i18nKey="This license key has reached the activation limit, <a>click here</a> to manage license and devices to deactivate old devices."
                                            components={{ a: <a href='https://chatboxai.app/redirect_app/manage_license' target='_blank' rel='noreferrer' /> }}
                                        />
                                    </Box>
                                )
                            }
                        </>
                    }
                />
                {!premium.premiumActivated && (
                    <Box>
                        <ButtonGroup
                            disabled={premium.premiumIsLoading}
                            aria-label="outlined primary button group"
                            sx={{ display: 'block', marginBottom: '15px' }}
                        >
                            <Button variant="text" onClick={() => premium.activate(settingsEdit.licenseKey || '')}>
                                {premium.premiumIsLoading ? t('Activating...') : t('Activate License')}
                            </Button>
                        </ButtonGroup>
                    </Box>
                )}
                {premium.premiumActivated && (
                    <ChatboxAIModelSelect
                        settingsEdit={settingsEdit}
                        setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
                    />
                )}
                {CHATBOX_BUILD_TARGET === 'mobile_app' ? (
                    <DetailCardForMobileApp licenseKey={settingsEdit.licenseKey} premium={premium} />
                ) : (
                    <DetailCard licenseKey={settingsEdit.licenseKey} premium={premium} />
                )}
            </Box>
        </Box>
    )
}

// 详细信息卡片
function DetailCard(props: { licenseKey?: string, premium: ReturnType<typeof usePremium> }) {
    const { licenseKey, premium } = props
    const { t } = useTranslation()
    return (
        <Card sx={{ marginTop: '20px', padding: '10px 14px' }} elevation={3}>
            {
                premium.premiumActivated && (
                    <Box>
                        <Box className='mb-4'>
                            <ActivedButtonGroup premium={premium} />
                        </Box>
                        <LicenseDetail licenseKey={licenseKey} />
                    </Box>
                )
            }
            <Box className='mt-4' sx={{ opacity: premium.premiumActivated ? '0.5' : undefined }}>
                <Typography>
                    {t('Chatbox AI offers a user-friendly AI solution to help you enhance productivity')}
                </Typography>
                <Box>
                    {[t('Fast access to AI services'), t('Hassle-free setup'), t('Ideal for work and study')].map(
                        (item) => (
                            <Box key={item} sx={{ display: 'flex', margin: '4px 0' }}>
                                <CheckCircleOutlineIcon color={premium.premiumActivated ? 'success' : 'action'} />
                                <b style={{ marginLeft: '5px' }}>{item}</b>
                            </Box>
                        )
                    )}
                </Box>
            </Box>
            {
                !premium.premiumActivated && (<InactivedButtonGroup />)
            }
        </Card>
    )
}

// 移动应用的详细信息卡片
function DetailCardForMobileApp(props: { licenseKey?: string, premium: ReturnType<typeof usePremium> }) {
    const { premium, licenseKey } = props
    const { t } = useTranslation()
    return premium.premiumActivated ? (
        <Card sx={{ marginTop: '20px', padding: '14px' }} elevation={3}>
            <span
                style={{
                    fontWeight: 'bold',
                    backgroundColor: 'green',
                    color: 'white',
                    padding: '2px 4px',
                }}
            >
                {t('License Activated')}!
            </span>
            <ActivedButtonGroup premium={premium} />
            <LicenseDetail licenseKey={licenseKey} />
        </Card>
    ) : null
}

// 激活后的按钮组
function ActivedButtonGroup(props: { premium: ReturnType<typeof usePremium> }) {
    const { premium } = props
    const { t } = useTranslation()
    return (
        <Box sx={{ marginTop: '10px' }}>
            <Button
                variant="outlined"
                sx={{ marginRight: '10px' }}
                onClick={() => {
                    runtime.openLink('https://chatboxai.app/redirect_app/manage_license')
                    window.gtag('event', 'click_manage_license_button', {
                        event_category: 'user',
                    })
                }}
            >
                {t('Manage License and Devices')}
            </Button>
            <Button
                variant='outlined'
                // color='warning'
                sx={{ marginRight: '10px' }}
                onClick={() => {
                    premium.deactivate()
                    window.gtag('event', 'click_deactivate_license_button', {
                        event_category: 'user',
                    })
                }}
            >
                {t('Deactivate')}
            </Button>
            <Button
                variant="text"
                sx={{ marginRight: '10px' }}
                onClick={() => {
                    runtime.openLink('https://chatboxai.app/redirect_app/view_more_plans')
                    window.gtag('event', 'click_view_more_plans_button', {
                        event_category: 'user',
                    })
                }}
            >
                {t('View More Plans')}
            </Button>
        </Box>
    )
}

// 未激活时的按钮组
function InactivedButtonGroup() {
    const { t } = useTranslation()
    return (
        <Box sx={{ marginTop: '10px' }}>
            <Button
                variant="outlined"
                sx={{ marginRight: '10px' }}
                onClick={() => {
                    runtime.openLink('https://chatboxai.app/redirect_app/get_license')
                    window.gtag('event', 'click_get_license_button', { event_category: 'user' })
                }}
            >
                {t('Get License')}
            </Button>
            <Button
                variant="text"
                sx={{ marginRight: '10px' }}
                onClick={() => {
                    runtime.openLink('https://chatboxai.app/redirect_app/manage_license')
                    window.gtag('event', 'click_retrieve_license_button', {
                        event_category: 'user',
                    })
                }}
            >
                {t('Retrieve License')}
            </Button>
        </Box>
    )
}

function BorderLinearProgress(props: LinearProgressProps) {
    return (<_BorderLinearProgress variant="determinate" {...props}
        color={
            props.value !== undefined && props.value <= 10
                ? 'error'
                : props.value !== undefined && props.value <= 20 ? 'warning' : 'inherit'
        }
    />)
}

const _BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 5,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
    },
    [`& .${linearProgressClasses.bar}`]: {
        borderRadius: 5,
    },
}));

function LicenseDetail(props: { licenseKey?: string }) {
    const { licenseKey } = props
    const { t } = useTranslation()
    const [expanded, setExpanded] = useState<boolean>(false);
    const [licenseDetail, setLicenseDetail] = useState<ChatboxAILicenseDetail | null>(null)
    const onChange = (event: React.SyntheticEvent, newExpanded: boolean) => {
        setExpanded(newExpanded);
        if (!newExpanded) {
            setLicenseDetail(null)
            return
        }
        if (!licenseKey) {
            return
        }
        remote.getLicenseDetailRealtime({ licenseKey }).then((res) => {
            if (res) {
                setTimeout(() => {
                    setLicenseDetail(res)
                }, 200)    // 太快了，看不到加载效果
            }
        })
    }
    return (
        <Accordion expanded={expanded} onChange={onChange} className='mb-4'>
            <AccordionSummary>
                <div>
                    <span className='font-bold text-green-700 block'>
                        {t('License Activated')}!
                    </span>
                    <span className='opacity-50 text-xs font-light block'>
                        {t('Click to view license details and quota usage')}
                    </span>
                </div>
            </AccordionSummary>
            <AccordionDetails>
                {
                    licenseDetail ? (
                        <>
                            <Box className='grid sm:grid-cols-2'>
                                <Tooltip title={`${(licenseDetail.remaining_quota_35 * 100).toFixed(2)} %`}>
                                    <Box className='mr-4 mb-4' >
                                        <Typography className=''>
                                            {t('Chatbox AI 3.5 Quota')}
                                        </Typography>
                                        <BorderLinearProgress className='mt-1' variant="determinate"
                                            value={Math.floor(licenseDetail.remaining_quota_35 * 100)} />
                                    </Box>
                                </Tooltip>
                                {
                                    licenseDetail.type === 'chatboxai-4' && (
                                        <Tooltip title={`${(licenseDetail.remaining_quota_4 * 100).toFixed(2)} %`}>
                                            <Box className='mr-4 mb-4' >
                                                <Typography className=''>
                                                    {t('Chatbox AI 4 Quota')}
                                                </Typography>
                                                <BorderLinearProgress className='mt-1' variant="determinate"
                                                    value={Math.floor(licenseDetail.remaining_quota_4 * 100)} />
                                            </Box>
                                        </Tooltip>
                                    )
                                }
                                <Tooltip title={`${licenseDetail.image_total_quota - licenseDetail.image_used_count} / ${licenseDetail.image_total_quota}`}>
                                    <Box className='mr-4 mb-4' >
                                        <Typography >
                                            {t('Chatbox AI Image Quota')}
                                        </Typography>
                                        <BorderLinearProgress className='mt-1' variant="determinate"
                                            value={Math.floor(licenseDetail.remaining_quota_image * 100)} />
                                    </Box>
                                </Tooltip>
                            </Box>
                            <Box className='grid grid-cols-2'>
                                <Box className='mr-4 mb-4' >
                                    <Typography className=''>
                                        {t('Quota Reset')}
                                    </Typography>
                                    <Typography className=''><span className='font-bold'>{
                                        new Date(licenseDetail.token_refreshed_time).toLocaleDateString()
                                    }</span></Typography>
                                </Box>
                                {
                                    licenseDetail.token_expire_time && (
                                        <Box className='mr-4 mb-4' >
                                            <Typography className=''>
                                                {t('License Expiry')}
                                            </Typography>
                                            <Typography className=''><span className='font-bold'>{
                                                new Date(licenseDetail.token_expire_time).toLocaleDateString()
                                            }</span></Typography>
                                        </Box>
                                    )
                                }
                                <Box className='mr-4 mb-4' >
                                    <Typography className=''>
                                        {t('License Plan Overview')}
                                    </Typography>
                                    <Typography>
                                        <span className='font-bold'>
                                            {{
                                                [licenseDetail.type]: licenseDetail.type,   // 兼容未来的套餐
                                                'chatboxai-4': 'Chatbox AI Pro',
                                                'chatboxai-3.5': 'Chatbox AI Lite',
                                            }[licenseDetail.type]}
                                        </span>
                                    </Typography>
                                </Box>
                            </Box>
                        </>
                    ) : (
                        <Box className='flex items-center justify-center'>
                            <CircularProgress />
                        </Box>

                    )
                }
            </AccordionDetails>
        </Accordion>
    )
}