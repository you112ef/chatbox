import { useEffect } from 'react'
import * as api from '../packages/runtime'
import { getConfig } from '../storage'

function useAnalytics() {
    // GA4
    useEffect(() => {
        const GAID = 'G-B365F44W6E'
        ; (async () => {
            try {
                const conf = await getConfig()
                window.gtag('config', GAID, {
                    'app_name': 'chatbox',
                    'user_id': conf.uuid,
                    'client_id': conf.uuid,
                    app_version: await api.getVersion(),
                    chatbox_platform: await api.getPlatform(),
                    app_platform: await api.getPlatform(),
                })
            } catch (e) {
                window.gtag('config', GAID, {
                    'app_name': 'chatbox',
                })
                throw e
            }
        })()
    }, [])
}

export default useAnalytics
