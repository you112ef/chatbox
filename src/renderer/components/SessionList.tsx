import React, { MutableRefObject } from 'react'
import SessionItem from './SessionItem'
import { Session } from '../../shared/types'
import * as atoms from '../stores/atoms'
import { useAtomValue, useSetAtom } from 'jotai'
import type { DragEndEvent } from '@dnd-kit/core'
import { MenuList, IconButton, ListSubheader } from '@mui/material'
import { useTranslation } from 'react-i18next'
import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableItem } from './SortableItem'

export interface Props {
    setConfigureChatConfig(session: Session): void
    openClearWindow(): void
    sessionListRef: MutableRefObject<HTMLDivElement | null>
}

export default function SessionList(props: Props) {
    // states
    const sortedSessions = useAtomValue(atoms.sortedSessionsAtom)
    const setSessions = useSetAtom(atoms.sessionsAtom)
    const currentSessionId = useAtomValue(atoms.currentSessionIdAtom)

    // 拖拽
    const sensors = useSensors(
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over) {
            return
        }
        if (active.id !== over.id) {
            const oldIndex = sortedSessions.findIndex(({ id }) => id === active.id)
            const newIndex = sortedSessions.findIndex(({ id }) => id === over.id)
            const newReversed = arrayMove(sortedSessions, oldIndex, newIndex)
            setSessions(atoms.sortSessions(newReversed))
        }
    }

    return (
        <MenuList
            sx={{
                width: '100%',
                position: 'relative',
                overflow: 'auto',
                height: '60vh',
                '& ul': { padding: 0 },
            }}
            className="scroll"
            subheader={<Subheader openClearWindow={props.openClearWindow} />}
            component="div"
            ref={props.sessionListRef}
        >
            <DndContext
                modifiers={[restrictToVerticalAxis]}
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={sortedSessions} strategy={verticalListSortingStrategy}>
                    {sortedSessions.map((session, ix) => (
                        <SortableItem key={session.id} id={session.id}>
                            <SessionItem
                                key={session.id}
                                selected={currentSessionId === session.id}
                                session={session}
                                setConfigureChatConfig={props.setConfigureChatConfig}
                            />
                        </SortableItem>
                    ))}
                </SortableContext>
            </DndContext>
        </MenuList>
    )
}

function Subheader(props: { openClearWindow: () => void }) {
    const { t } = useTranslation()
    return (
        <ListSubheader
            className="flex justify-between items-center"
            sx={{ padding: '0.1rem 0.2rem', margin: '0.1rem 0.1rem 0.1rem 0.2rem' }}
        >
            <span className="text-xs opacity-80">{t('chat')}</span>
            <IconButton onClick={props.openClearWindow}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 opacity-80"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                    />
                </svg>
            </IconButton>
        </ListSubheader>
    )
}
