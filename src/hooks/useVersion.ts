import { useState, useEffect, useRef } from 'react'
import { useAtomValue } from 'jotai'
import { configsAtom } from '../stores/atoms'
import * as api from '../api'
import * as remote from '../remote'

export default function useVersion() {
    const config = useAtomValue(configsAtom)

    const [version, _setVersion] = useState('unknown')
    const [needCheckUpdate, setNeedCheckUpdate] = useState(false)
    const updateCheckTimer = useRef<NodeJS.Timeout>()
    useEffect(() => {
        const handler = async () => {
            const version = await api.getVersion()
            _setVersion(version)
            try {
                const os = await api.getPlatform()
                const needUpdate = await remote.checkNeedUpdate(version, os, config)
                setNeedCheckUpdate(needUpdate)
            } catch (e) {
                console.log(e)
                setNeedCheckUpdate(true)
            }
        }
        handler()
        updateCheckTimer.current = setInterval(handler, 10 * 60 * 1000)
        return () => {
            if (updateCheckTimer.current) {
                clearInterval(updateCheckTimer.current)
                updateCheckTimer.current = undefined
            }
        }
    }, [])

    return {
        version,
        needCheckUpdate,
    }
}