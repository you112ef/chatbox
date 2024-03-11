import storage from '@/storage'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import MiniButton from './MiniButton'

export function ImageInStorage(props: {
    storageKey: string
    className?: string
}) {
    const [base64, setPic] = useState<string>('')
    useEffect(() => {
        storage.getBlob(props.storageKey).then((blob) => {
            if (blob) {
                setPic(blob)
            }
        })
    }, [props.storageKey])
    if (!base64) {
        return null
    }
    const picBase64 = base64.startsWith('data:image/') ? base64 : `data:image/png;base64,${base64}`
    return <img src={picBase64} className={`max-w-full max-h-full ${props.className || ''}`} />
}

export function Image(props: {
    src: string
    className?: string
}) {
    return <img src={props.src} className={`max-w-full max-h-full ${props.className || ''}`} />
}

export function ImageMiniCard(props: {
    storageKey: string
    onDelete: () => void
}) {
    const { storageKey, onDelete } = props
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div
            key={storageKey}
            className="w-[160px] h-[160px] p-1 m-1 inline-flex items-center justify-center
                                bg-white shadow-sm rounded-md border-solid border-gray-400/20
                                hover:shadow-lg hover:cursor-pointer hover:scale-105 transition-all duration-200"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <ImageInStorage storageKey={storageKey} />
            {onDelete && isHovered && (
                <MiniButton className="absolute top-0 right-0 m-1 p-1 rounded-full shadow-lg text-red-500"
                    onClick={onDelete}
                >
                    <Trash2 size='22' strokeWidth={2} />
                </MiniButton>
            )}
        </div>
    )
}
