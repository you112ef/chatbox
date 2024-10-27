import { TextField, Button, Dialog, DialogContent, DialogActions, DialogTitle } from '@mui/material'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useAtom, useSetAtom } from 'jotai'
import { useState } from 'react'
import _ from 'lodash'

export default function OpenAttachLinkDialog(props: {}) {
    const { t } = useTranslation()
    const [open, setOpen] = useAtom(atoms.openAttachLinkDialogAtom)
    const [input, setInput] = useState('')
    const setInputBoxLinks = useSetAtom(atoms.inputBoxLinksAtom)
    const onClose = () => {
        setInput('')
        setOpen(false)
    }
    const onSubmit = () => {
        if (!open) {
            return
        }
        const raw = input.trim()
        const urls = raw.split(/\s+/)
            .map(url => url.trim())
            .map(url => url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`)
        setInputBoxLinks(links => {
            let newLinks = [...links, ...urls.map(u => ({ url: u }))]
            newLinks = _.uniqBy(newLinks, 'url')
            newLinks = newLinks.slice(-6) // 最多插入 6 个链接
            return newLinks
        })
        onClose()
    }
    const onInput = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setInput(e.target.value)
    }
    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!open) {
            return
        }
        const ctrlOrCmd = event.ctrlKey || event.metaKey
        // ctrl + enter 提交
        if (event.keyCode === 13 && ctrlOrCmd) {
            event.preventDefault()
            onSubmit()
            return
        }
    }

    if (!open) {
        return null
    }
    return (
        <Dialog open={!!open} onClose={onClose} fullWidth>
            <DialogTitle>{t('Attach Link')}</DialogTitle>
            <DialogContent>
                <TextField
                    className='w-full'
                    autoFocus
                    multiline // multiline 需要和 maxRows 一起使用，否则长文本可能会导致退出编辑？
                    minRows={5}
                    maxRows={15}
                    placeholder={`https://example.com\nhttps://example.com/page`}
                    value={input}
                    onChange={onInput}
                    onKeyDown={onKeyDown}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={onSubmit}>{t('submit')}</Button>
            </DialogActions>
        </Dialog>
    )
}
