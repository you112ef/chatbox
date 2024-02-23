import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import MenuItem from '@mui/material/MenuItem'
import {
    CircularProgress,
    IconButton,
    Divider,
    Typography,
    Grid,
    Menu,
    MenuProps,
    Tooltip,
    ButtonGroup,
    useTheme,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import SettingsIcon from '@mui/icons-material/Settings'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import EditIcon from '@mui/icons-material/Edit'
import { styled, alpha } from '@mui/material/styles'
import StopIcon from '@mui/icons-material/Stop'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import * as utils from '../packages/utils'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import { useTranslation } from 'react-i18next'
import { Message, OpenAIRoleEnum, OpenAIRoleEnumType, SessionType } from '../../shared/types'
import ReplayIcon from '@mui/icons-material/Replay'
import CopyAllIcon from '@mui/icons-material/CopyAll'
import { useAtomValue, useSetAtom } from 'jotai'
import {
    messageEditDialogShowAtom,
    messageScrollingScrollPositionAtom,
    pictureShowAtom,
    quoteAtom,
    showModelNameAtom,
    showTokenCountAtom,
    showWordCountAtom,
} from '../stores/atoms'
import { currsentSessionPicUrlAtom, showTokenUsedAtom } from '../stores/atoms'
import * as sessionActions from '../stores/sessionActions'
import * as toastActions from '../stores/toastActions'
import * as scrollActions from '../stores/scrollActions'
import Markdown from '@/components/Markdown'
import '../static/Block.css'
import { throttle } from 'lodash'
import { ImageInStorage, Image } from './Image'
import SouthIcon from '@mui/icons-material/South'
import ImageIcon from '@mui/icons-material/Image'
import MessageErrTips from './MessageErrTips'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import * as dom from '@/hooks/dom'

export interface Props {
    id?: string
    sessionId: string
    sessionType: SessionType
    msg: Message
}

function _Message(props: Props) {
    const { t } = useTranslation()
    const theme = useTheme()

    const showModelName = useAtomValue(showModelNameAtom)
    const showTokenCount = useAtomValue(showTokenCountAtom)
    const showWordCount = useAtomValue(showWordCountAtom)
    const showTokenUsed = useAtomValue(showTokenUsedAtom)
    const currentSessionPicUrl = useAtomValue(currsentSessionPicUrlAtom)
    const messageScrollingScrollPosition = useAtomValue(messageScrollingScrollPositionAtom)
    const setPictureShow = useSetAtom(pictureShowAtom)
    const setMessageEditDialogShow = useSetAtom(messageEditDialogShowAtom)

    const { msg } = props

    const [isHovering, setIsHovering] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const [autoScrollId, setAutoScrollId] = useState<null | string>(null)

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

    const onGenerateMore = () => {
        sessionActions.refreshMessage(props.sessionId, msg, true)
    }

    const onCopyMsg = () => {
        utils.copyToClipboard(msg.content)
        toastActions.add(t('copied to clipboard'))
        setAnchorEl(null)
    }

    const setMsg = (updated: Message) => {
        sessionActions.modifyMessage(props.sessionId, updated, true)
    }
    const onDelMsg = () => {
        setIsHovering(false)
        setAnchorEl(null)
        sessionActions.removeMessage(props.sessionId, msg.id)
    }
    const onEditClick = () => {
        setIsHovering(false)
        setAnchorEl(null)
        setMessageEditDialogShow({
            sessionId: props.sessionId,
            msg: msg,
        })
    }

    const tips: string[] = []
    if (props.sessionType === 'chat' || !props.sessionType) {
        if (showWordCount && !msg.generating) {
            // 兼容旧版本没有提前计算的消息
            tips.push(`word count: ${msg.wordCount !== undefined ? msg.wordCount : utils.countWord(msg.content)}`)
        }
        if (showTokenCount && !msg.generating) {
            // 兼容旧版本没有提前计算的消息
            if (msg.tokenCount === undefined) {
                msg.tokenCount = utils.estimateTokensFromMessages([msg])
            }
            tips.push(`token count: ${msg.tokenCount}`)
        }
        if (showTokenUsed && msg.role === 'assistant' && !msg.generating) {
            tips.push(`tokens used: ${msg.tokensUsed || 'unknown'}`)
        }
        if (showModelName && props.msg.role === 'assistant') {
            tips.push(`model: ${props.msg.model || 'unknown'}`)
        }
    } else if (props.sessionType === 'picture') {
        if (showModelName && props.msg.role === 'assistant') {
            tips.push(`model: ${props.msg.model || 'unknown'}`)
            tips.push(`style: ${props.msg.style || 'unknown'}`)
        }
    }

    let displayButtonGroup = false
    if (isHovering) {
        displayButtonGroup = true // 鼠标悬停时，显示按钮组
    }
    if (msg.generating) {
        displayButtonGroup = true // 消息生成中，显示按钮组
    }

    let fixedButtonGroup = false
    if (ref.current) {
        // 总共可能出现五种情况：
        // 1. 当前消息完全在视图可见范围之上，则不固定按钮组
        // 2. 当前消息部分在视图可见范围之外但露出尾部，则不固定按钮组
        // 3. 当前消息完全在视图可见范围之内，则不固定按钮组
        // 4. 当前消息部分在视图可见范围之外但露出头部，固定按钮组
        // 5. 当前消息完全在视图可见范围之下，则不固定按钮组
        // 因此仅考虑第4中情况
        if (msg.generating) {
            if (
                // 元素的前半部分在可视范围内，且露出至少50px
                ref.current.offsetTop + 50 < messageScrollingScrollPosition &&
                // 元素的后半部分不在可视范围内，并且为消息生成导致的长度变化预留 50px 的空间
                ref.current.offsetTop + ref.current.offsetHeight + 50 >= messageScrollingScrollPosition
            ) {
                fixedButtonGroup = true
            }
        } else {
            if (
                // 元素的前半部分在可视范围内，且露出至少50px
                ref.current.offsetTop + 50 < messageScrollingScrollPosition &&
                // 元素的后半部分不在可视范围内，但如果只掩盖了 40px 则无所谓
                ref.current.offsetTop + ref.current.offsetHeight - 40 >= messageScrollingScrollPosition
            ) {
                fixedButtonGroup = true
            }
        }
    }

    // 消息生成中自动跟踪滚动
    useEffect(() => {
        if (msg.generating) {
            const autoId = scrollActions.startAutoScroll(msg.id, 'end')
            setAutoScrollId(autoId)
        } else {
            if (autoScrollId) {
                scrollActions.tickAutoScroll(autoScrollId)  // 清理之前，最后再滚动一次，确保非流式生成的消息也能滚动到底部
                scrollActions.clearAutoScroll(autoScrollId)
            }
            setAutoScrollId(null)
        }
    }, [msg.generating])
    const throttledScroll = useCallback(
        throttle(() => {
            if (msg.generating && autoScrollId) {
                scrollActions.tickAutoScroll(autoScrollId)
            }
        }, 100),
        [msg.generating, autoScrollId]
    )
    useEffect(throttledScroll, [msg.content])

    return (
        <Box
            ref={ref}
            id={props.id}
            key={msg.id}
            onMouseOver={() => {
                setIsHovering(true)
            }}
            onMouseLeave={() => {
                setIsHovering(false)
            }}
            className={[
                'msg-block',
                'px-2',
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
            <Grid container wrap="nowrap" spacing={1.5}>
                <Grid item>
                    <Box sx={{ marginTop: '8px' }}>
                        {
                            {
                                assistant: currentSessionPicUrl ? (
                                    <Avatar
                                        src={currentSessionPicUrl}
                                        sx={{
                                            width: '28px',
                                            height: '28px',
                                        }}
                                    />
                                ) : props.sessionType === 'picture' ? (
                                    <Avatar
                                        sx={{
                                            backgroundColor: theme.palette.secondary.main,
                                            width: '28px',
                                            height: '28px',
                                        }}
                                    >
                                        <ImageIcon fontSize='small' />
                                    </Avatar>
                                ) : (
                                    <Avatar
                                        sx={{
                                            backgroundColor: theme.palette.primary.main,
                                            width: '28px',
                                            height: '28px',
                                        }}
                                    >
                                        <SmartToyIcon fontSize='small' />
                                    </Avatar>
                                ),
                                user: (
                                    <Avatar
                                        sx={{
                                            width: '28px',
                                            height: '28px',
                                        }}
                                    >
                                        <PersonIcon fontSize='small' />
                                    </Avatar>
                                ),
                                system:
                                    props.sessionType === 'picture' ? (
                                        <Avatar
                                            sx={{
                                                backgroundColor: theme.palette.secondary.main,
                                                width: '28px',
                                                height: '28px',
                                            }}
                                        >
                                            <ImageIcon fontSize='small' />
                                        </Avatar>
                                    ) : (
                                        <Avatar
                                            sx={{
                                                backgroundColor: theme.palette.warning.main,
                                                width: '28px',
                                                height: '28px',
                                            }}
                                        >
                                            <SettingsIcon fontSize='small' />
                                        </Avatar>
                                    ),
                            }[msg.role]
                        }
                    </Box>
                </Grid>
                <Grid item xs sm container sx={{ width: '0px', paddingRight: '15px' }}>
                    <Grid item xs>
                        <Box className={'msg-content ' + (msg.role === 'system' ? 'msg-content-system' : '')}>
                            <Markdown>
                                {(typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)) +
                                    (msg.generating ? '...' : '')}
                            </Markdown>
                            {msg.pictures && (
                                <div className='flex flex-row items-start justify-start'>
                                    {
                                        msg.pictures.map((pic, index) => (
                                            <div
                                                key={index}
                                                className="w-[200px] h-[200px] p-2 m-1 inline-flex items-center justify-center
                                                bg-white shadow-sm rounded-md
                                                hover:shadow-lg hover:cursor-pointer hover:scale-105 transition-all duration-200"
                                                onClick={() => setPictureShow(pic)}
                                            >
                                                {
                                                    pic.loading && !pic.storageKey && !pic.url && (
                                                        <CircularProgress className='block max-w-full max-h-full' color='secondary' />
                                                    )
                                                }
                                                {
                                                    pic.storageKey && (
                                                        <ImageInStorage storageKey={pic.storageKey} />
                                                    )
                                                }
                                                {
                                                    pic.url && (
                                                        <Image src={pic.url} />
                                                    )
                                                }
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                            <MessageErrTips msg={msg} />
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.5 }}>
                            {tips.join(', ')}
                        </Typography>
                        <Box sx={{ height: '35px' }}>
                            <ButtonGroup
                                sx={{
                                    display: displayButtonGroup ? 'inline-flex' : 'none',
                                    height: '35px',
                                    opacity: 1,
                                    ...(fixedButtonGroup
                                        ? {
                                            position: 'fixed',
                                            bottom: dom.getInputBoxHeight() + 4 + 'px',
                                            zIndex: 100,
                                        }
                                        : {}),
                                    backgroundColor:
                                        theme.palette.mode === 'dark'
                                            ? theme.palette.grey[800]
                                            : theme.palette.background.paper,
                                }}
                                variant="contained"
                                color={props.sessionType === 'picture' ? 'secondary' : 'primary'}
                                aria-label="outlined primary button group"
                            >
                                {msg.generating && (
                                    <Tooltip title={t('stop generating')} placement="top">
                                        <IconButton aria-label="edit" color="warning" onClick={onStop}>
                                            <StopIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {
                                    // 生成中的消息不显示刷新按钮，必须是助手消息
                                    !msg.generating && msg.role === 'assistant' &&
                                    (
                                        <Tooltip title={t('Reply Again')} placement="top">
                                            <IconButton
                                                aria-label="Reply Again"
                                                onClick={onRefresh}
                                                color={props.sessionType === 'picture' ? 'secondary' : 'primary'}
                                            >
                                                <ReplayIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )
                                }
                                {!msg.generating && msg.role === 'user' && (
                                    <Tooltip title={t('Reply Again Below')} placement="top">
                                        <IconButton
                                            aria-label="Reply Again Below"
                                            onClick={onRefresh}
                                            color={props.sessionType === 'picture' ? 'secondary' : 'primary'}
                                        >
                                            <SouthIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {
                                    // Chatbox-AI 模型不支持编辑消息
                                    !msg.model?.startsWith('Chatbox-AI') &&
                                    // 图片会话中，助手消息无需编辑
                                    !(msg.role === 'assistant' && props.sessionType === 'picture') &&
                                    (
                                        <Tooltip title={t('edit')} placement="top">
                                            <IconButton
                                                aria-label="edit"
                                                color={props.sessionType === 'picture' ? 'secondary' : 'primary'}
                                                onClick={onEditClick}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )
                                }
                                {!(props.sessionType === 'picture' && msg.role === 'assistant') && (
                                    <Tooltip title={t('copy')} placement="top">
                                        <IconButton
                                            aria-label="copy"
                                            onClick={onCopyMsg}
                                            color={props.sessionType === 'picture' ? 'secondary' : 'primary'}
                                        >
                                            <CopyAllIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {
                                    !msg.generating && props.sessionType === 'picture' && msg.role === 'assistant' && (
                                        <Tooltip title={t('Generate More Images Below')} placement="top">
                                            <IconButton
                                                aria-label="copy"
                                                onClick={onGenerateMore}
                                                color='secondary'
                                            >
                                                <AddPhotoAlternateIcon className='mr-1' fontSize="small" />
                                                <Typography fontSize="small">{t('More Images')}</Typography>
                                            </IconButton>
                                        </Tooltip>
                                    )
                                }
                                <IconButton
                                    onClick={handleClick}
                                    color={props.sessionType === 'picture' ? 'secondary' : 'primary'}
                                >
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
                        </Box>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
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
        '& hr': {
            margin: '4px 0',
        },
    },
}))

export default function Message(props: Props) {
    return useMemo(() => {
        return <_Message {...props} />
    }, [props.msg])
}
