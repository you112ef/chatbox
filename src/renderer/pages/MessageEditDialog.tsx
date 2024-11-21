import {
    Typography,
    TextField,
    SelectChangeEvent,
    Avatar,
    MenuItem,
    Select,
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import * as atoms from '../stores/atoms'
import { useAtom } from 'jotai'
import { MessageRoleEnum, MessageRole } from 'src/shared/types'
import * as sessionActions from '../stores/sessionActions'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import SettingsIcon from '@mui/icons-material/Settings'
import { useIsSmallScreen } from '@/hooks/useScreenChange'

interface Props {}

export default function MessageEditDialog(props: Props) {
    const { t } = useTranslation()
    const isSmallScreen = useIsSmallScreen()
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
    const onSaveAndReply = () => {
        if (!data) {
            return
        }
        onSave()
        sessionActions.generateMoreInNewFork(data.sessionId, data.msg.id)
    }

    const onRoleSelect = (e: SelectChangeEvent) => {
        if (!data) {
            return
        }
        setData({
            ...data,
            msg: {
                ...data.msg,
                role: e.target.value as MessageRole,
            },
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
            },
        })
    }
    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!data) {
            return
        }
        const ctrlOrCmd = event.ctrlKey || event.metaKey
        const shift = event.shiftKey

        // ctrl + shift + enter 保存并生成
        if (event.keyCode === 13 && ctrlOrCmd && shift) {
            event.preventDefault()
            onSaveAndReply()
            return
        }
        // ctrl + enter 保存
        if (event.keyCode === 13 && ctrlOrCmd && !shift) {
            event.preventDefault()
            onSave()
            return
        }
    }

    if (!data) {
        return null
    }
    return (
        <Dialog
            open={!!data}
            onClose={onClose}
            fullWidth
            // classes={{ paper: 'h-4/5' }}
        >
            <DialogTitle></DialogTitle>
            <DialogContent>
                <Select
                    value={data.msg.role}
                    onChange={onRoleSelect}
                    size="small"
                    id={data.msg.id + 'select'}
                    className="mb-2"
                >
                    <MenuItem value={MessageRoleEnum.System}>
                        <Avatar>
                            <SettingsIcon />
                        </Avatar>
                    </MenuItem>
                    <MenuItem value={MessageRoleEnum.User}>
                        <Avatar>
                            <PersonIcon />
                        </Avatar>
                    </MenuItem>
                    <MenuItem value={MessageRoleEnum.Assistant}>
                        <Avatar>
                            <SmartToyIcon />
                        </Avatar>
                    </MenuItem>
                </Select>
                <TextField
                    className="w-full"
                    autoFocus={!isSmallScreen}
                    multiline // multiline 需要和 maxRows 一起使用，否则长文本可能会导致退出编辑？
                    minRows={5}
                    maxRows={15}
                    placeholder="prompt"
                    value={data.msg.content}
                    onChange={onContentInput}
                    id={data.msg.id + 'input'}
                    onKeyDown={onKeyDown}
                />
                {!isSmallScreen && (
                    <Typography variant="caption" style={{ opacity: 0.3 }}>
                        {t('[Ctrl+Enter] Save, [Ctrl+Shift+Enter] Save and Resend')}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={onSaveAndReply}>{t('Save & Resend')}</Button>
                <Button onClick={onSave}>{t('save')}</Button>
            </DialogActions>
        </Dialog>
    )
}
