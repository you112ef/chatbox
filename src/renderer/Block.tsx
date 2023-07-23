import { useEffect, useState, useRef, useMemo, useCallback, MutableRefObject } from 'react'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import MenuItem from '@mui/material/MenuItem'
import {
    IconButton,
    Divider,
    ListItem,
    Typography,
    Grid,
    TextField,
    Menu,
    MenuProps,
    Tooltip,
    ButtonGroup,
    Alert,
    useTheme,
} from '@mui/material'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import SettingsIcon from '@mui/icons-material/Settings'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import CheckIcon from '@mui/icons-material/Check'
import EditIcon from '@mui/icons-material/Edit'
import { styled, alpha } from '@mui/material/styles'
import StopIcon from '@mui/icons-material/Stop'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import * as utils from './utils'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import { Trans, useTranslation } from 'react-i18next'
import { Message, OpenAIRoleEnum, OpenAIRoleEnumType } from './types'
import { aiProviderNameHash } from './config'
import ReplayIcon from '@mui/icons-material/Replay'
import CopyAllIcon from '@mui/icons-material/CopyAll'
import './styles/block.css'
import { useAtomValue, useSetAtom } from 'jotai'
import { quoteAtom, showModelNameAtom, showTokenCountAtom, showWordCountAtom } from './stores/atoms'
import { currsentSessionPicUrlAtom, showTokenUsedAtom } from './stores/atoms'
import * as sessionActions from './stores/sessionActions'
import * as toastActions from './stores/toastActions'
import * as settingActions from './stores/settingActions'
import md from './markdown'
import '../../node_modules/highlight.js/styles/github-dark.css'

export interface Props {
    id?: string
    sessionId: string
    msg: Message
}

function _Block(props: Props) {
    const { t } = useTranslation()
    const theme = useTheme()

    const showModelName = useAtomValue(showModelNameAtom)
    const showTokenCount = useAtomValue(showTokenCountAtom)
    const showWordCount = useAtomValue(showWordCountAtom)
    const showTokenUsed = useAtomValue(showTokenUsedAtom)
    const currentSessionPicUrl = useAtomValue(currsentSessionPicUrlAtom)

    const { msg } = props

    const [isHovering, setIsHovering] = useState(false)
    const [msgEdit, setMsgEdit] = useState<Message | null>(null)
    useEffect(() => {
        setMsgEdit(null)
    }, [msg])

    const setQuote = useSetAtom(quoteAtom)
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }
    const handleClose = () => {
        setAnchorEl(null)
    }

    const quoteMsg = () => {
        let input = msg.content
            .split('\n')
            .map((line: any) => `> ${line}`)
            .join('\n')
        input += '\n\n-------------------\n\n'
        setQuote(input)
    }

    // stop action
    const onStop = useCallback(() => {
        sessionActions.modifyMessage(props.sessionId, { ...msg, generating: false }, true)
        msg?.cancel?.()
    }, [msg])

    const onRefresh = useCallback(() => {
        onStop()
        sessionActions.refreshMessage(props.sessionId, msg)
    }, [onStop])

    const onCopyMsg = () => {
        navigator.clipboard.writeText(msg.content)
        toastActions.add(t('copied to clipboard'))
        setAnchorEl(null)
    }

    const setMsg = (updated: Message) => {
        sessionActions.modifyMessage(props.sessionId, updated, true)
    }
    const onDelMsg = () => {
        setMsgEdit(null)
        setIsHovering(false)
        setAnchorEl(null)
        sessionActions.removeMessage(props.sessionId, msg.id)
    }

    const tips: string[] = []
    if (showWordCount && !msg.generating) {
        // 兼容旧版本没有提前计算的消息
        tips.push(`word count: ${msg.wordCount !== undefined ? msg.wordCount : utils.countWord(msg.content)}`)
    }
    if (showTokenCount && !msg.generating) {
        // 兼容旧版本没有提前计算的消息
        tips.push(
            `token count: ~${msg.tokenCount !== undefined ? msg.tokenCount : utils.estimateTokensFromMessages([msg])}`
        )
    }
    if (showTokenUsed && msg.role === 'assistant' && !msg.generating) {
        tips.push(`tokens used: ~${msg.tokensUsed || 'unknown'}`)
    }
    if (showModelName && props.msg.role === 'assistant') {
        tips.push(`model: ${props.msg.model || 'unknown'}`)
    }
    return (
        <ListItem
            id={props.id}
            key={msg.id}
            onMouseEnter={() => {
                setIsHovering(true)
            }}
            onMouseOver={() => {
                setIsHovering(true)
            }}
            onMouseLeave={() => {
                setIsHovering(false)
            }}
            className={[
                'msg-block',
                msg.generating ? 'rendering' : 'render-done',
                {
                    user: 'user-msg',
                    system: 'system-msg',
                    assistant: 'assistant-msg',
                }[msg?.role || 'user'],
            ].join(' ')}
            sx={{
                margin: '0',
                paddingTop: '0.5rem',
                paddingBottom: '0.2rem',
                paddingX: '1rem',
                [theme.breakpoints.down('sm')]: {
                    paddingX: '0.3rem',
                },
            }}
        >
            <Grid container wrap="nowrap" spacing={2}>
                <Grid item>
                    {msgEdit ? (
                        <Select
                            value={msgEdit.role}
                            onChange={(e: SelectChangeEvent) => {
                                setMsgEdit({
                                    ...msgEdit,
                                    role: e.target.value as OpenAIRoleEnumType,
                                })
                            }}
                            size="small"
                            id={msgEdit.id + 'select'}
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
                    ) : (
                        <Box sx={{ marginTop: '8px' }}>
                            {
                                {
                                    assistant: currentSessionPicUrl ? (
                                        <Avatar src={currentSessionPicUrl}></Avatar>
                                    ) : (
                                        <Avatar>
                                            <SmartToyIcon />
                                        </Avatar>
                                    ),
                                    user: (
                                        <Avatar>
                                            <PersonIcon />
                                        </Avatar>
                                    ),
                                    system: (
                                        <Avatar>
                                            <SettingsIcon />
                                        </Avatar>
                                    ),
                                }[msg.role]
                            }
                        </Box>
                    )}
                </Grid>
                <Grid item xs sm container sx={{ width: '0px', paddingRight: '15px' }}>
                    <Grid item xs>
                        {msgEdit ? (
                            <TextField
                                style={{
                                    width: '100%',
                                }}
                                multiline
                                placeholder="prompt"
                                value={msgEdit.content}
                                onChange={(e) => {
                                    setMsgEdit({
                                        ...msgEdit,
                                        content: e.target.value,
                                    })
                                }}
                                id={msgEdit.id + 'input'}
                            />
                        ) : (
                            <>
                                <Box
                                    sx={{
                                        wordBreak: 'break-word',
                                        wordWrap: 'break-word',
                                    }}
                                    className={'msg-content ' + (msg.role === 'system' ? 'msg-content-system' : '')}
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            md.render(
                                                typeof msg.content === 'string'
                                                    ? msg.content
                                                    : JSON.stringify(msg.content)
                                            ) +
                                            (msg.generating && msg.content !== '...'
                                                ? '<span class="loading"></span>'
                                                : ''),
                                    }}
                                />
                                {msg.error && (
                                    <Alert icon={false} severity="error">
                                        {msg.error}
                                        <br />
                                        <br />
                                        {msg.error.startsWith('API Error') && (
                                            <Trans
                                                i18nKey="api error tips"
                                                values={{
                                                    aiProvider: msg.aiProvider
                                                        ? aiProviderNameHash[msg.aiProvider]
                                                        : 'AI Provider',
                                                }}
                                                components={[
                                                    <a
                                                        href={`https://chatboxai.app/redirect_app/faqs/${settingActions.getLanguage()}`}
                                                        target="_blank"
                                                    ></a>,
                                                ]}
                                            />
                                        )}
                                        {msg.error.startsWith('Network Error') && (
                                            <Trans
                                                i18nKey="network error tips"
                                                values={{
                                                    host: msg.errorExtra?.['host'] || 'AI Provider',
                                                }}
                                            />
                                        )}
                                        {!msg.error.startsWith('API Error') &&
                                            !msg.error.startsWith('Network Error') && (
                                                <Trans
                                                    i18nKey="unknown error tips"
                                                    components={[
                                                        <a
                                                            href={`https://chatboxai.app/redirect_app/faqs/${settingActions.getLanguage()}`}
                                                            target="_blank"
                                                        ></a>,
                                                    ]}
                                                />
                                            )}
                                    </Alert>
                                )}
                            </>
                        )}
                        <Typography variant="body2" sx={{ opacity: 0.5 }}>
                            {tips.join(', ')}
                        </Typography>
                        <Box sx={{ height: '35px' }}>
                            {msgEdit ? (
                                <ButtonGroup
                                    sx={{ height: '35px' }}
                                    variant="contained"
                                    aria-label="outlined primary button group"
                                >
                                    <IconButton
                                        onClick={() => {
                                            setMsg(msgEdit)
                                            setMsgEdit(null)
                                        }}
                                        size="large"
                                        color="primary"
                                    >
                                        <CheckIcon />
                                    </IconButton>
                                </ButtonGroup>
                            ) : (
                                ((isHovering && !msgEdit) || msg.generating) && (
                                    <ButtonGroup
                                        sx={{ height: '35px' }}
                                        variant="contained"
                                        aria-label="outlined primary button group"
                                    >
                                        {msg.generating ? (
                                            <Tooltip title={t('stop generating')} placement="top">
                                                <IconButton aria-label="edit" color="warning" onClick={onStop}>
                                                    <StopIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip title={t('regenerate')} placement="top">
                                                <IconButton aria-label="edit" color="primary" onClick={onRefresh}>
                                                    <ReplayIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {!(msg.model === 'Chatbox-AI') && (
                                            <Tooltip title={t('edit')} placement="top">
                                                <IconButton
                                                    aria-label="edit"
                                                    color="primary"
                                                    onClick={() => {
                                                        setIsHovering(false)
                                                        setAnchorEl(null)
                                                        setMsgEdit(msg)
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title={t('copy')} placement="top">
                                            <IconButton aria-label="copy" color="primary" onClick={onCopyMsg}>
                                                <CopyAllIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <IconButton onClick={handleClick} color="primary">
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                        <StyledMenu
                                            MenuListProps={{
                                                'aria-labelledby': 'demo-customized-button',
                                            }}
                                            anchorEl={anchorEl}
                                            open={open}
                                            onClose={handleClose}
                                            key={msg.id + 'menu'}
                                        >
                                            <MenuItem
                                                key={msg.id + 'quote'}
                                                onClick={() => {
                                                    setIsHovering(false)
                                                    setAnchorEl(null)
                                                    quoteMsg()
                                                }}
                                                disableRipple
                                            >
                                                <FormatQuoteIcon fontSize="small" />
                                                {t('quote')}
                                            </MenuItem>
                                            <Divider sx={{ my: 0.5 }} />
                                            <MenuItem key={msg.id + 'del'} onClick={onDelMsg} disableRipple>
                                                <DeleteForeverIcon fontSize="small" />
                                                {t('delete')}
                                            </MenuItem>
                                        </StyledMenu>
                                    </ButtonGroup>
                                )
                            )}
                        </Box>
                    </Grid>
                    <Grid item xs={1}></Grid>
                </Grid>
            </Grid>
        </ListItem>
    )
}

// <Divider variant="middle" light />
const StyledMenu = styled((props: MenuProps) => (
    <Menu
        elevation={0}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 6,
        marginTop: theme.spacing(1),
        minWidth: 140,
        color: theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
        boxShadow:
            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
        '& .MuiMenu-list': {
            padding: '4px 0',
        },
        '& .MuiMenuItem-root': {
            '& .MuiSvgIcon-root': {
                fontSize: 18,
                color: theme.palette.text.secondary,
                marginRight: theme.spacing(1.5),
            },
            '&:active': {
                backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
            },
        },
    },
}))

export default function Block(props: Props) {
    return useMemo(() => {
        return <_Block {...props} />
    }, [props.msg])
}
