import storage from '@/storage'
import { useEffect, useState } from 'react'

export default function ImageInStorage(props: { storageKey: string }) {
    const [base64, setPic] = useState<string>('')
    useEffect(() => {
        storage.getBlob<string>(props.storageKey).then((blob) => {
            if (blob) {
                setPic(blob)
            }
        })
    }, [props.storageKey])
    return <img src={`data:image/png;base64,${base64}`} className="max-w-full max-h-full" />
}
