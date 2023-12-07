import { TextField, SelectChangeEvent, Avatar, MenuItem, Select, Button, Dialog, DialogContent, DialogActions, DialogTitle } from '@mui/material'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useAtom } from 'jotai'
import SaveIcon from '@mui/icons-material/Save'
import { OpenAIRoleEnum, OpenAIRoleEnumType } from 'src/shared/types'
import * as sessionActions from '../stores/sessionActions'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import SettingsIcon from '@mui/icons-material/Settings'

interface Props {
}

export default function MessageEditDialog(props: Props) {
    const { t } = useTranslation()

    const [data, setData] = useAtom(atoms.messageEditDialogShowAtom)

    const onClose = () => {
        setData(null)
    }

    const onSave = () => {
        if (!data) {
            return
        }
        sessionActions.modifyMessage(data.sessionId, data.msg, true)
        onClose()
    }

    const onRoleSelect = (e: SelectChangeEvent) => {
        if (!data) {
            return
        }
        setData({
            ...data,
            msg: {
                ...data.msg,
                role: e.target.value as OpenAIRoleEnumType,
            }
        })
    }
    const onContentInput = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        if (!data) {
            return
        }
        setData({
            ...data,
            msg: {
                ...data.msg,
                content: e.target.value,
            }
        })
    }

    if (!data) {
        return null
    }
    return (
        <Dialog open={!!data} onClose={onClose} fullWidth
        // classes={{ paper: 'h-4/5' }}
        >
            <DialogTitle></DialogTitle>
            <DialogContent>
                <Select
                    value={data.msg.role}
                    onChange={onRoleSelect}
                    size="small"
                    id={data.msg.id + 'select'}
                    className='mb-2'
                >
                    <MenuItem value={OpenAIRoleEnum.System}>
                        <Avatar>
                            <SettingsIcon />
                        </Avatar>
                    </MenuItem>
                    <MenuItem value={OpenAIRoleEnum.User}>
                        <Avatar>
                            <PersonIcon />
                        </Avatar>
                    </MenuItem>
                    <MenuItem value={OpenAIRoleEnum.Assistant}>
                        <Avatar>
                            <SmartToyIcon />
                        </Avatar>
                    </MenuItem>
                </Select>
                <TextField
                    className='w-full'
                    autoFocus
                    multiline // multiline 需要和 maxRows 一起使用，否则长文本可能会导致退出编辑？
                    maxRows={15}
                    placeholder="prompt"
                    value={data.msg.content}
                    onChange={onContentInput}
                    id={data.msg.id + 'input'}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={onSave}>{t('save')}</Button>
            </DialogActions>
        </Dialog>
    )
}
