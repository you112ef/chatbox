import storage from '@/storage'
import React, { useEffect, useState } from 'react'
import { CircularProgress } from '@mui/material'

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
        return (
            <div className={`bg-slate-300/50 w-full h-full ${props.className || ''}`}>
                <div className="w-full h-full flex items-center justify-center">
                    <CircularProgress className='block max-w-full max-h-full opacity-50' color='secondary' />
                </div>
            </div>
        )
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

export function handleImageInputAndSave(event: React.ChangeEvent<HTMLInputElement>, key: string, updateKey?: (key: string) => void) {
    if (!event.target.files) {
        return
    }
    const file = event.target.files[0]
    if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = async (e) => {
            if (e.target && e.target.result) {
                const base64 = e.target.result as string
                await storage.setBlob(key, base64)
                if (updateKey) {
                    updateKey(key)
                }
            }
        }
        reader.readAsDataURL(file)
    }
    event.target.value = ''
}
