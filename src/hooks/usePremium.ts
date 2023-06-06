import { useState, useEffect } from 'react'
import * as remote from '../remote'
import useSWR from 'swr'
import { useAtom } from 'jotai'
import { settingsAtom } from '../stores/atoms'
import { activateLicense, deactivateLicense, validateLicense } from '../lemonsqueezy'
import * as api from '../api'
import { FetchError } from 'ofetch'

export function usePremium() {
    const [settings, setSettings] = useAtom(settingsAtom)

    // license activation
    const activateQuery = useSWR<{ valid: boolean }>(
        `license:${settings.premiumLicenseKey || ''}`,
        async () => {
            const licenseKey = settings.premiumLicenseKey || ''
            if (!licenseKey) {
                return { valid: false }
            }
            let instanceId = (settings.premiumLicenseInstances || {})[licenseKey]
            if (!instanceId) {
                instanceId = await activateLicense(licenseKey, await api.getInstanceName())
                setSettings((settings) => ({
                    ...settings,
                    premiumLicenseInstances: {
                        ...(settings.premiumLicenseInstances || {}),
                        [licenseKey]: instanceId,
                    },
                }))
            }
            return validateLicense(licenseKey, instanceId)
        },
        {
            fallbackData: (settings.premiumLicenseInstances || {})[settings.premiumLicenseKey || ''] ? { valid: true } : undefined,
            revalidateOnFocus: false,
            dedupingInterval: 10 * 60 * 1000,
            onError(err) {
                if (err instanceof FetchError) {
                    if (err.status === 404) {
                        setSettings((settings) => ({
                            ...settings,
                            premiumLicenseKey: '',
                            premiumLicenseInstances: {},
                        }))
                    }
                }
            },
        },
    )

    const activate = (licenseKey: string) => {
        setSettings((settings) => ({
            ...settings,
            premiumLicenseKey: licenseKey,
        }))
    }

    return {
        premiumActivated: activateQuery.data?.valid || false,
        premiumIsLoading: activateQuery.isLoading,
        activate,
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
