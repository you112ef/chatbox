import { useState, useEffect } from 'react'
import * as remote from '../packages/remote'
import useSWR from 'swr'
import { useAtom } from 'jotai'
import { settingsAtom } from '../stores/atoms'
import { activateLicense, deactivateLicense, validateLicense } from '../packages/lemonsqueezy'
import * as api from '../packages/runtime'
import { FetchError } from 'ofetch'
import { ModelProvider } from '../../shared/types'
import omit from 'lodash/omit'
import * as Sentry from '@sentry/react'

export function usePremium() {
    const [settings, setSettings] = useAtom(settingsAtom)
    const [activateNo, setActivateNo] = useState('init')    // 用于在点击激活按钮后强制刷新 license 激活状态

    // license activation
    const activateQuery = useSWR<{ valid: boolean }>(
        `license:${settings.licenseKey || ''}:${activateNo}`,
        async () => {
            const licenseKey = settings.licenseKey || ''
            if (!licenseKey) {
                return { valid: false }
            }
            let instanceId = (settings.licenseInstances || {})[licenseKey]
            // 如果 license 第一次在当前设备激活，则记录 instanceId 设备ID，并且根据 license 类型初始化默认的 AI 模型
            if (!instanceId) {
                instanceId = await activateLicense(licenseKey, await api.getInstanceName())
                const licenseDetail = await remote.getLicenseDetail({ licenseKey }).catch((e) => {
                    console.log(e)
                    return null
                })
                setSettings((settings) => {
                    const newSettings = {
                        ...settings,
                        licenseInstances: {
                            ...(settings.licenseInstances || {}),
                            [licenseKey]: instanceId,
                        },
                    }
                    if (licenseDetail) {
                        newSettings.licenseDetail = licenseDetail
                        if (!newSettings.chatboxAIModel) {
                            newSettings.chatboxAIModel = licenseDetail.defaultModel
                        }
                    }
                    return newSettings
                })
            }
            // 不管是否第一次在该设备激活，最后都要验证 license 在当前设备是否有效
            return await validateLicense(licenseKey, instanceId)
        },
        {
            fallbackData: (settings.licenseInstances || {})[settings.licenseKey || ''] ? { valid: true } : undefined,
            revalidateOnFocus: false,
            dedupingInterval: 20 * 60 * 1000,
            onError(err) {
                if (err instanceof FetchError) {
                    if (err.status && [401, 403].includes(err.status)) {
                        setSettings((settings) => ({
                            ...settings,
                            licenseKey: '',
                            licenseInstances: omit(settings.licenseInstances, settings.licenseKey || ''),
                        }))
                    }
                }
                Sentry.captureException(err)
            },
        }
    )

    const activate = (licenseKey: string) => {
        setSettings((settings) => ({
            ...settings,
            aiProvider: ModelProvider.ChatboxAI,
            licenseKey: licenseKey,
        }))
        setActivateNo(Math.random().toString()) // 强制刷新 license 激活状态
    }

    const deactivate = async () => {
        setSettings((settings) => ({
            ...settings,
            licenseKey: '',
            licenseInstances: omit(settings.licenseInstances, settings.licenseKey || ''),
        }))
        const licenseKey = settings.licenseKey || ''
        const licenseInstances = settings.licenseInstances || {}
        if (licenseKey && licenseInstances[licenseKey]) {
            await deactivateLicense(licenseKey, licenseInstances[licenseKey])
        }
    }

    return {
        premiumActivated: activateQuery.data?.valid || false,
        premiumIsLoading: activateQuery.isLoading,
        activate,
        deactivate,
    }
}

export function usePremiumPrice() {
    const [price, setPrice] = useState('???')
    const [discount, setDiscount] = useState('')
    useEffect(() => {
        remote.getPremiumPrice().then((data) => {
            setPrice(`$${data.price}`)
            setDiscount(`-${data.discountLabel}`)
        })
    }, [])
    return { price, discount }
}
