import { Button, ButtonGroup, Card, Typography, Box } from '@mui/material'
import { ModelSettings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import * as runtime from '../../packages/runtime'
import { usePremium } from '../../hooks/usePremium'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import PasswordTextField from '../../components/PasswordTextField'
import ChatboxAIModelSelect from '../../components/ChatboxAIModelSelect'
import { CHATBOX_BUILD_TARGET } from '@/variables'

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
                        <span style={{ color: 'green' }}>{premium.premiumActivated ? t('License Activated') : ''}</span>
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
                {settingsEdit.licenseDetail && (
                    <ChatboxAIModelSelect
                        settingsEdit={settingsEdit}
                        setSettingsEdit={(updated) => setSettingsEdit({ ...settingsEdit, ...updated })}
                    />
                )}
                {
                    CHATBOX_BUILD_TARGET === 'mobile_app'
                        ? <DetailCardForMobileApp premium={premium} />
                        : <DetailCard premium={premium} />
                }
            </Box>
        </Box>
    )
}

// 详细信息卡片
function DetailCard(props: { premium: ReturnType<typeof usePremium> }) {
    const { premium } = props
    const { t } = useTranslation()
    return (
        <Card sx={{ marginTop: '20px', padding: '14px' }} elevation={3}>
            {premium.premiumActivated && (
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
            )}
            <Typography sx={{ opacity: '1' }}>
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
            {
                premium.premiumActivated
                    ? <ActivedButtonGroup premium={premium} />
                    : <InactivedButtonGroup />
            }
        </Card>
    )
}

// 移动应用的详细信息卡片
function DetailCardForMobileApp(props: { premium: ReturnType<typeof usePremium> }) {
    const { premium } = props
    const { t } = useTranslation()
    return (
        premium.premiumActivated && // 只有激活了才显示
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
        </Card>
    )
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
                variant="text"
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
