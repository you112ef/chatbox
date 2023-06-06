import React, { MutableRefObject } from 'react';
import SessionItem from './SessionItem'
import { Session } from './types'
import * as atoms from './stores/atoms'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import * as sessionActions from './stores/sessionActions'
import type { DragEndEvent } from '@dnd-kit/core';
import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableItem } from './SortableItem';

export interface Props {
    setConfigureChatConfig(session: Session): void
    textareaRef: MutableRefObject<HTMLTextAreaElement | null>
}

export default function SessionList(props: Props) {
    // states
    const sortedSessions = useAtomValue(atoms.sortedSessionsAtom)
    const setSessions = useSetAtom(atoms.sessionsAtom)
    const [currentSession, setCurrentSession] = useAtom(atoms.currentSessionAtom)

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
    );
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over) {
            return
        }
        if (active.id !== over.id) {
            const oldIndex = sortedSessions.findIndex(({ id }) => id === active.id);
            const newIndex = sortedSessions.findIndex(({ id }) => id === over.id);
            const newReversed = arrayMove(sortedSessions, oldIndex, newIndex);
            setSessions(atoms.sortSessions(newReversed))
        }
    }

    return (
        <DndContext
            modifiers={[restrictToVerticalAxis]}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={sortedSessions} strategy={verticalListSortingStrategy}>
                {
                    sortedSessions.map((session, ix) => (
                        <SortableItem key={session.id} id={session.id}>
                            <SessionItem key={session.id}
                                selected={currentSession.id === session.id}
                                session={session}
                                switchMe={() => {
                                    setCurrentSession(session)
                                    props.textareaRef?.current?.focus()
                                }}
                                deleteMe={() => sessionActions.remove(session)}
                                copyMe={() => {
                                    sessionActions.copy(session)
                                }}
                                switchStarred={() => {
                                    sessionActions.modify({
                                        ...session,
                                        starred: !session.starred
                                    })
                                }}
                                editMe={() => props.setConfigureChatConfig(session)}
                            />
                        </SortableItem>
                    ))
                }
            </SortableContext>
        </DndContext>
    )
}