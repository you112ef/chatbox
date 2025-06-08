import { useState, useEffect, useRef, useMemo } from 'react'
import platform from '../platform'
import { useAtomValue } from 'jotai'
import { remoteConfigAtom } from '@/stores/atoms'
import { compareVersions } from 'compare-versions'
import { CHATBOX_BUILD_PLATFORM } from '@/variables'

function getInitialTime() {
  let initialTime = parseInt(localStorage.getItem('initial-time') || '')
  if (!initialTime) {
    initialTime = Date.now()
    localStorage.setItem('initial-time', `${initialTime}`)
  }

  return initialTime
}

export default function useVersion() {
  const remoteConfig = useAtomValue(remoteConfigAtom)
  const [version, _setVersion] = useState('')
  const isExceeded = useMemo(
    () =>
      CHATBOX_BUILD_PLATFORM === 'ios' &&
      Date.now() - getInitialTime() < 24 * 3600 * 1000 &&
      version &&
      remoteConfig.current_version &&
      compareVersions(version, remoteConfig.current_version) === 1,
    [version, remoteConfig]
  )
  const updateCheckTimer = useRef<NodeJS.Timeout>()
  useEffect(() => {
    const handler = async () => {
      const version = await platform.getVersion()
      _setVersion(version)
    }
    handler()
    updateCheckTimer.current = setInterval(handler, 2 * 60 * 60 * 1000)
    return () => {
      if (updateCheckTimer.current) {
        clearInterval(updateCheckTimer.current)
        updateCheckTimer.current = undefined
      }
    }
  }, [])

  return {
    version,
    isExceeded,
  }
}
