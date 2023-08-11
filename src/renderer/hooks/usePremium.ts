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

export function usePremium() {
    const [settings, setSettings] = useAtom(settingsAtom)

    // license activation
    const activateQuery = useSWR<{ valid: boolean }>(
        `license:${settings.licenseKey || ''}`,
        async () => {
            const licenseKey = settings.licenseKey || ''
            if (!licenseKey) {
                return { valid: false }
            }
            let instanceId = (settings.licenseInstances || {})[licenseKey]
            if (!instanceId) {
                instanceId = await activateLicense(licenseKey, await api.getInstanceName())
                setSettings((settings) => ({
                    ...settings,
                    licenseInstances: {
                        ...(settings.licenseInstances || {}),
                        [licenseKey]: instanceId,
                    },
                }))
            }
            return validateLicense(licenseKey, instanceId)
        },
        {
            fallbackData: (settings.licenseInstances || {})[settings.licenseKey || ''] ? { valid: true } : undefined,
            revalidateOnFocus: false,
            dedupingInterval: 10 * 60 * 1000,
            onError(err) {
                if (err instanceof FetchError) {
                    if (err.status && err.status >= 400 && err.status < 500) {
                        setSettings((settings) => ({
                            ...settings,
                            licenseKey: '',
                            licenseInstances: omit(settings.licenseInstances, settings.licenseKey || ''),
                        }))
                    }
                }
            },
        }
    )

    const activate = (licenseKey: string) => {
        setSettings((settings) => ({
            ...settings,
            aiProvider: ModelProvider.ChatboxAI,
            licenseKey: licenseKey,
        }))
    }

    const deactivate = async () => {
        const licenseKey = settings.licenseKey || ''
        const licenseInstances = settings.licenseInstances || {}
        if (licenseKey && licenseInstances[licenseKey]) {
            await deactivateLicense(licenseKey, licenseInstances[licenseKey])
        }
        setSettings((settings) => ({
            ...settings,
            licenseKey: '',
            licenseInstances: omit(settings.licenseInstances, settings.licenseKey || ''),
        }))
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
