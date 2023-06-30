import { useEffect } from 'react'
import * as api from '../api'
import { useAtomValue } from 'jotai'
import { configsAtom } from '../stores/atoms'
import ReactGA from 'react-ga4'

function useAnalytics() {
    const conf = useAtomValue(configsAtom)
    // GA4
    useEffect(() => {
        ;(async () => {
            const GAID = 'G-B365F44W6E'
            try {
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
