import storage from '@/storage'
import { useEffect, useState } from 'react'

export function ImageInStorage(props: { storageKey: string }) {
    const [base64, setPic] = useState<string>('')
    useEffect(() => {
        storage.getBlob(props.storageKey).then((blob) => {
            if (blob) {
                setPic(blob)
            }
        })
    }, [props.storageKey])
    return <img src={`data:image/png;base64,${base64}`} className="max-w-full max-h-full" />
}

export function Image(props: { src: string }) {
    return <img src={props.src} className="max-w-full max-h-full" />
}
