import { useEffect } from 'react'
import * as api from '../packages/runtime'
import { getConfig } from '../storage'
import ReactGA from 'react-ga4'

function useAnalytics() {
    // GA4
    useEffect(() => {
        ; (async () => {
            const GAID = 'G-B365F44W6E'
            try {
                const conf = await getConfig()
                const options = {
                    app_version: await api.getVersion(),
                    chatbox_platform: await api.getPlatform(),
                    clientId: conf.uuid,
                    userId: conf.uuid,
                }
                ReactGA.initialize([
                    {
                        trackingId: GAID,
                        gaOptions: options,
                        gtagOptions: options,
                    },
                ])
                ReactGA.set(options)
                // https://github.com/codler/react-ga4/issues/7
                ReactGA.gtag('config', GAID, {
                    'user_id': conf.uuid,
                });
                ReactGA.send({
                    hitType: 'pageview',
                    page: window.location.pathname + window.location.search,
        			user_id: conf.uuid,
                })
            } catch (e) {
                ReactGA.initialize(GAID)
                throw e
            }
        })()
    }, [])
}

export default useAnalytics
