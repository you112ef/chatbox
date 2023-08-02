import { useEffect } from 'react'
import * as api from '../api'
import { getConfig } from '../storage'
import ReactGA from 'react-ga4'

function useAnalytics() {
    // GA4
    useEffect(() => {
        ;(async () => {
            const GAID = 'G-B365F44W6E'
            try {
                const conf = await getConfig()
                const version = await api.getVersion()
                const platfrom = await api.getPlatform()
                ReactGA.initialize([
                    {
                        trackingId: GAID,
                        gaOptions: {
                            app_version: version,
                            clientId: conf.uuid,
                            chatbox_platform: platfrom,
                        },
                        gtagOptions: {
                            app_version: version,
                            clientId: conf.uuid,
                            chatbox_platform: platfrom,
                        },
                    },
                ])
            } catch (e) {
                ReactGA.initialize(GAID)
                throw e
            }
        })()
    }, [])
}

export default useAnalytics
