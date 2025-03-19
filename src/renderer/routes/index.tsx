import { currentSessionIdAtom } from '@/stores/atoms'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAtomValue } from 'jotai'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const navigate = useNavigate()
  const currentSessionId = useAtomValue(currentSessionIdAtom)

  useEffect(() => {
    navigate({
      to: `/session/${currentSessionId}`,
    })
  }, [currentSessionId])
  return <div className="p-2"></div>
}
