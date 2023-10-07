import React, { useState, useEffect } from 'react'
import {
    Button,
    Avatar,
    useTheme,
    IconButton,
    Tabs,
    Tab,
    Divider,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    TextField,
    FormGroup,
    FormControlLabel,
    Switch,
    MenuItem,
    Typography,
    Box,
    ButtonGroup,
} from '@mui/material'
import { Config, CopilotDetail, Message } from '../../shared/types'
import { useTranslation } from 'react-i18next'
import EditIcon from '@mui/icons-material/Edit'
import StyledMenu from '../components/StyledMenu'
import StarIcon from '@mui/icons-material/Star'
import StarOutlineIcon from '@mui/icons-material/StarOutline'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined'
import { useMyCopilots, useRemoteCopilots } from '../hooks/useCopilots'
import * as remote from '../packages/remote'
import { v4 as uuidv4 } from 'uuid'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import * as atoms from '../stores/atoms'
import * as sessionActions from '../stores/sessionActions'
import { useAtomValue } from 'jotai'
import * as storage from '../storage'

interface Props {
    open: boolean
    close(): void
    // openPremiumPage(): void
    // premiumActivated: boolean
}

export default function CopilotWindow(props: Props) {
    const language = useAtomValue(atoms.languageAtom)

    const { t } = useTranslation()

    const store = useMyCopilots()
    const remoteStore = useRemoteCopilots(language, props.open)

    const createChatSessionWithCopilot = (copilot: CopilotDetail) => {
        const msgs: Message[] = []
        msgs.push({ id: uuidv4(), role: 'system', content: copilot.prompt })
        if (copilot.demoQuestion) {
            msgs.push({
                id: uuidv4(),
                role: 'user',
                content: copilot.demoQuestion,
            })
        }
        if (copilot.demoAnswer) {
            msgs.push({
                id: uuidv4(),
                role: 'assistant',
                content: copilot.demoAnswer,
            })
        }
        sessionActions.create({
            id: uuidv4(),
            name: copilot.name,
            picUrl: copilot.picUrl,
            messages: msgs,
            starred: false,
            copilotId: copilot.id,
        })
        window.gtag('event', 'create_copilot_conversation', { event_category: 'user' })
    }

    const useCopilot = (detail: CopilotDetail) => {
        const newDetail = { ...detail, usedCount: (detail.usedCount || 0) + 1 }
        if (newDetail.shared) {
            remote.recordCopilotShare(newDetail)
        }
        store.addOrUpdate(newDetail)
        createChatSessionWithCopilot(newDetail)
        props.close()
    }

    const [copilotEdit, setCopilotEdit] = useState<CopilotDetail | null>(null)
    useEffect(() => {
        if (!props.open) {
            setCopilotEdit(null)
        } else {
            window.gtag('event', 'screen_view', { screen_name: 'copilot_window' })
        }
    }, [props.open])

    const list = [
        ...store.copilots.filter((item) => item.starred).sort((a, b) => b.usedCount - a.usedCount),
        ...store.copilots.filter((item) => !item.starred).sort((a, b) => b.usedCount - a.usedCount),
    ]

    return (
        <Dialog open={props.open} onClose={props.close} fullWidth maxWidth="md" classes={{ paper: 'h-4/5' }}>
            <DialogTitle>{t('My Copilots')}</DialogTitle>
            <DialogContent style={{ width: '100%' }}>
                {copilotEdit ? (
                    <CopilotForm
                        copilotDetail={copilotEdit}
                        close={() => {
                            setCopilotEdit(null)
                        }}
                        save={(detail) => {
                            store.addOrUpdate(detail)
                            setCopilotEdit(null)
                        }}
                        // premiumActivated={props.premiumActivated}
                        // openPremiumPage={props.openPremiumPage}
                    />
                ) : (
                    <Button
                        variant="outlined"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => {
                            getEmptyCopilot().then(setCopilotEdit)
                        }}
                    >
                        {t('Create New Copilot')}
                    </Button>
                )}
                <ScrollableTabsButtonAuto
                    values={[{ value: 'my', label: t('My Copilots') }]}
                    currentValue="my"
                    onChange={() => {}}
                />
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        width: '100%',
                        overflowY: 'auto',
                    }}
                >
                    {list.map((item) => (
                        <MiniItem
                            mode="local"
                            detail={item}
                            useMe={() => useCopilot(item)}
                            switchStarred={() => {
                                store.addOrUpdate({
                                    ...item,
                                    starred: !item.starred,
                                })
                            }}
                            editMe={() => {
                                setCopilotEdit(item)
                            }}
                            deleteMe={() => {
                                store.remove(item.id)
                            }}
                        />
                    ))}
                </div>

                <ScrollableTabsButtonAuto
                    values={[
                        {
                            value: 'chatbox-featured',
                            label: t('Chatbox Featured'),
                        },
                    ]}
                    currentValue="chatbox-featured"
                    onChange={() => {}}
                />
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        width: '100%',
                        overflowY: 'auto',
                    }}
                >
                    {remoteStore.copilots.map((item) => (
                        <MiniItem mode="remote" detail={item} useMe={() => useCopilot(item)} />
                    ))}
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.close}>{t('close')}</Button>
            </DialogActions>
        </Dialog>
    )
}

type MiniItemProps =
    | {
          mode: 'local'
          detail: CopilotDetail
          useMe(): void
          switchStarred(): void
          editMe(): void
          deleteMe(): void
      }
    | {
          mode: 'remote'
          detail: CopilotDetail
          useMe(): void
      }

function MiniItem(props: MiniItemProps) {
    const { t } = useTranslation()
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)
    const [hovering, setHovering] = useState(false)
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        event.preventDefault()
        setAnchorEl(event.currentTarget)
    }
    const handleClose = () => {
        setAnchorEl(null)
    }
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                border: '1px solid #ccc',
                padding: '5px',
                margin: '5px',
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: '#eee',
                },
                '.edit-icon': {
                    opacity: 0,
                },
                '&:hover .edit-icon': {
                    opacity: 1,
                },
            }}
        >
            <Avatar
                onClick={props.useMe}
                sizes="30px"
                sx={{ width: '30px', height: '30px' }}
                src={props.detail.picUrl}
            ></Avatar>
            <div
                onClick={props.useMe}
                style={{
                    marginLeft: '5px',
                    width: '100px',
                }}
            >
                <Typography variant="body1" noWrap>
                    {props.detail.name}
                </Typography>
            </div>

            {props.mode === 'local' && (
                <>
                    <div
                        style={{
                            width: '30px',
                            height: '10px',
                            marginLeft: '2px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <IconButton onClick={handleClick}>
                            {props.detail.starred ? (
                                <StarIcon color="primary" fontSize="small" />
                            ) : (
                                <MoreHorizOutlinedIcon className="edit-icon" color="primary" fontSize="small" />
                            )}
                        </IconButton>
                    </div>
                    <StyledMenu
                        MenuListProps={{
                            'aria-labelledby': 'long-button',
                        }}
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        onMouseEnter={() => {
                            setHovering(true)
                        }}
                        onMouseOver={() => {
                            setHovering(true)
                        }}
                        onMouseLeave={() => {
                            setHovering(false)
                        }}
                    >
                        <MenuItem
                            key={'star'}
                            onClick={() => {
                                props.switchStarred()
                                handleClose()
                            }}
                            disableRipple
                        >
                            {props.detail.starred ? (
                                <>
                                    <StarOutlineIcon fontSize="small" />
                                    {t('unstar')}
                                </>
                            ) : (
                                <>
                                    <StarIcon fontSize="small" />
                                    {t('star')}
                                </>
                            )}
                        </MenuItem>

                        <MenuItem
                            key={'edit'}
                            onClick={() => {
                                props.editMe()
                                handleClose()
                            }}
                            disableRipple
                        >
                            <EditIcon />
                            {t('edit')}
                        </MenuItem>

                        <Divider sx={{ my: 0.5 }} />

                        <MenuItem
                            key={'del'}
                            onClick={() => {
                                setAnchorEl(null)
                                handleClose()
                                props.deleteMe()
                            }}
                            disableRipple
                        >
                            <DeleteForeverIcon />
                            {t('delete')}
                        </MenuItem>
                    </StyledMenu>
                </>
            )}
        </Box>
    )
}

interface TabsProps {
    currentValue: string
    values: { value: string; label: string }[]
    onChange(value: string): void
}
function ScrollableTabsButtonAuto(props: TabsProps) {
    return (
        <Box sx={{ marginTop: '14px' }}>
            <Tabs
                component="a"
                value={props.currentValue}
                onChange={(event, newValue) => {
                    props.onChange(newValue)
                }}
                variant="scrollable"
                scrollButtons={false}
            >
                {props.values.map((item) => (
                    <Tab key={item.value} label={item.label} value={item.value} />
                ))}
            </Tabs>
        </Box>
    )
}

interface CopilotFormProps {
    copilotDetail: CopilotDetail
    close(): void
    save(copilotDetail: CopilotDetail): void
    // premiumActivated: boolean
    // openPremiumPage(): void
}

function CopilotForm(props: CopilotFormProps) {
    const { t } = useTranslation()
    const theme = useTheme()
    const [copilotEdit, setCopilotEdit] = useState<CopilotDetail>(props.copilotDetail)
    useEffect(() => {
        setCopilotEdit(props.copilotDetail)
    }, [props.copilotDetail])
    const [helperTexts, setHelperTexts] = useState({
        name: <></>,
        prompt: <></>,
    })
    const inputHandler = (field: keyof CopilotDetail, trim = true) => {
        return (event: React.ChangeEvent<HTMLInputElement>) => {
            setHelperTexts({ name: <></>, prompt: <></> })
            if (trim) {
                setCopilotEdit({
                    ...copilotEdit,
                    [field]: event.target.value.trim(),
                })
            } else {
                setCopilotEdit({ ...copilotEdit, [field]: event.target.value })
            }
        }
    }
    const save = () => {
        if (copilotEdit.name.trim().length === 0) {
            setHelperTexts({
                ...helperTexts,
                name: <p style={{ color: 'red' }}>{t('cannot be empty')}</p>,
            })
            return
        }
        if (copilotEdit.prompt.trim().length === 0) {
            setHelperTexts({
                ...helperTexts,
                prompt: <p style={{ color: 'red' }}>{t('cannot be empty')}</p>,
            })
            return
        }
        props.save(copilotEdit)
        window.gtag('event', 'create_copilot', { event_category: 'user' })
    }
    return (
        <Box sx={{
            marginBottom: '20px',
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[50],
            padding: '8px',
         }}>
            <TextField
                autoFocus
                margin="dense"
                label={t('Copilot Name')}
                fullWidth
                variant="outlined"
                placeholder={t('My Assistant') as any}
                value={copilotEdit.name}
                onChange={inputHandler('name')}
                helperText={helperTexts['name']}
            />
            <TextField
                margin="dense"
                label={t('Copilot Prompt')}
                placeholder={t('Copilot Prompt Demo') as any}
                fullWidth
                variant="outlined"
                multiline
                maxRows={4}
                value={copilotEdit.prompt}
                onChange={inputHandler('prompt', false)}
                helperText={helperTexts['prompt']}
            />
            <TextField
                margin="dense"
                label={t('Copilot Avatar URL')}
                placeholder="http://xxxxx/xxx.png"
                fullWidth
                variant="outlined"
                value={copilotEdit.picUrl}
                onChange={inputHandler('picUrl')}
                // disabled={!props.premiumActivated}
                // helperText={
                //     props.premiumActivated ? (
                //         <></>
                //     ) : (
                //         <Button onClick={props.openPremiumPage}>{t('Unlock Copilot Avatar by Upgrading to Premium Edition')}</Button>
                //     )
                // }
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <FormGroup row>
                    <FormControlLabel
                        control={<Switch />}
                        label={t('Share with Chatbox')}
                        checked={copilotEdit.shared}
                        onChange={(e, checked) => setCopilotEdit({ ...copilotEdit, shared: checked })}
                    />
                </FormGroup>
                <ButtonGroup>
                    <Button variant="outlined" onClick={() => props.close()}>
                        {t('cancel')}
                    </Button>
                    <Button variant="contained" onClick={save}>
                        {t('save')}
                    </Button>
                </ButtonGroup>
            </Box>
        </Box>
    )
}

export async function getEmptyCopilot(): Promise<CopilotDetail> {
    const conf = await storage.getConfig()
    return {
        id: `${conf.uuid}:${uuidv4()}`,
        name: '',
        picUrl: '',
        prompt: '',
        starred: false,
        usedCount: 0,
        shared: true,
    }
}
