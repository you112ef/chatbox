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
    Tooltip,
    ButtonGroup,
    useTheme,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import SettingsIcon from '@mui/icons-material/Settings'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import EditIcon from '@mui/icons-material/Edit'
import StopIcon from '@mui/icons-material/Stop'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import { useTranslation } from 'react-i18next'
import { Message, SessionType } from '../../shared/types'
import ReplayIcon from '@mui/icons-material/Replay'
import CopyAllIcon from '@mui/icons-material/CopyAll'
import { useAtomValue, useSetAtom } from 'jotai'
import {
    messageEditDialogShowAtom,
    messageScrollingScrollPositionAtom,
    pictureShowAtom,
    quoteAtom,
    showMessageTimestampAtom,
    showModelNameAtom,
    showTokenCountAtom,
    showWordCountAtom,
    defaultAssistantAvatarKeyAtom,
    userAvatarKeyAtom,
    openSettingDialogAtom,
    enableMarkdownRenderingAtom,
    enableLaTeXRenderingAtom,
    enableMermaidRenderingAtom,
    currentSessionAssistantAvatarKeyAtom,
    chatConfigDialogIdAtom,
    widthFullAtom,
    autoPreviewArtifactsAtom,
    autoCollapseCodeBlockAtom,
} from '../stores/atoms'
import { currsentSessionPicUrlAtom, showTokenUsedAtom } from '../stores/atoms'
import * as sessionActions from '../stores/sessionActions'
import * as toastActions from '../stores/toastActions'
import * as scrollActions from '../stores/scrollActions'
import Markdown from '@/components/Markdown'
import '../static/Block.css'
import { ImageInStorage, Img } from './Image'
import SouthIcon from '@mui/icons-material/South'
import ImageIcon from '@mui/icons-material/Image'
import MessageErrTips from './MessageErrTips'
import StyledMenu from './StyledMenu'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import * as dom from '@/hooks/dom'
import * as dateFns from "date-fns"
import { cn } from '@/lib/utils'
import FileIcon from './FileIcon'
import { Loader } from 'lucide-react'
import { copyToClipboard } from '@/packages/navigator'
import { estimateTokensFromMessages } from '@/packages/token'
import { countWord } from '@/packages/word-count'
import { isContainRenderableCode, MessageArtifact } from './Artifact'

export interface Props {
    id?: string
    sessionId: string
    sessionType: SessionType
    msg: Message
    className?: string
    collapseThreshold?: number  // 文本长度阀值, 超过这个长度则会被折叠
    hiddenButtonGroup?: boolean
    small?: boolean
    preferCollapsedCodeBlock?: boolean
}

function _Message(props: Props) {
    const { msg, className, collapseThreshold, hiddenButtonGroup, small, preferCollapsedCodeBlock } = props
    const { t } = useTranslation()
    const theme = useTheme()

    const currentSessionAssistantAvatarKey = useAtomValue(currentSessionAssistantAvatarKeyAtom)
    const defaultAssistantAvatarKey = useAtomValue(defaultAssistantAvatarKeyAtom)
    const userAvatarKey = useAtomValue(userAvatarKeyAtom)
    const showMessageTimestamp = useAtomValue(showMessageTimestampAtom)
    const showModelName = useAtomValue(showModelNameAtom)
    const showTokenCount = useAtomValue(showTokenCountAtom)
    const showWordCount = useAtomValue(showWordCountAtom)
    const showTokenUsed = useAtomValue(showTokenUsedAtom)
    const enableMarkdownRendering = useAtomValue(enableMarkdownRenderingAtom)
    const enableLaTeXRendering = useAtomValue(enableLaTeXRenderingAtom)
    const enableMermaidRendering = useAtomValue(enableMermaidRenderingAtom)
    const currentSessionPicUrl = useAtomValue(currsentSessionPicUrlAtom)
    const messageScrollingScrollPosition = useAtomValue(messageScrollingScrollPositionAtom)
    const setPictureShow = useSetAtom(pictureShowAtom)
    const setMessageEditDialogShow = useSetAtom(messageEditDialogShowAtom)
    const setOpenSettingWindow = useSetAtom(openSettingDialogAtom)
    const setChatConfigDialog = useSetAtom(chatConfigDialogIdAtom);
    const widthFull = useAtomValue(widthFullAtom)
    const autoPreviewArtifacts = useAtomValue(autoPreviewArtifactsAtom)
    const autoCollapseCodeBlock = useAtomValue(autoCollapseCodeBlockAtom)

    const [previewArtifact, setPreviewArtifact] = useState(autoPreviewArtifacts)

    const needCollapse = collapseThreshold
        && props.sessionType !== 'picture'  // 绘图会话不折叠
        && (JSON.stringify(msg.content)).length > collapseThreshold
        && (JSON.stringify(msg.content)).length - collapseThreshold > 50    // 只有折叠有明显效果才折叠，为了更好的用户体验
    const [isCollapsed, setIsCollapsed] = useState(needCollapse)

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

    const handleStop = () => {
        sessionActions.modifyMessage(props.sessionId, { ...msg, generating: false }, true)
        msg?.cancel?.()
    }

    const handleRefresh = () => {
        handleStop()
        sessionActions.refreshMessage(props.sessionId, msg)
    }

    const onGenerateMore = () => {
        sessionActions.refreshMessage(props.sessionId, msg, true)
    }

    const onCopyMsg = () => {
        copyToClipboard(msg.content)
        toastActions.add(t('copied to clipboard'))
        setAnchorEl(null)
    }

    const setMsg = (updated: Message) => {
        sessionActions.modifyMessage(props.sessionId, updated, true)
    }
    const onDelMsg = () => {
        setAnchorEl(null)
        sessionActions.removeMessage(props.sessionId, msg.id)
    }
    const onEditClick = () => {
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
            tips.push(`word count: ${msg.wordCount !== undefined ? msg.wordCount : countWord(msg.content)}`)
        }
        if (showTokenCount && !msg.generating) {
            // 兼容旧版本没有提前计算的消息
            if (msg.tokenCount === undefined) {
                msg.tokenCount = estimateTokensFromMessages([msg])
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

    // 消息时间戳
    if (showMessageTimestamp && msg.timestamp !== undefined) {
        let date = new Date(msg.timestamp)
        let messageTimestamp: string
        if (dateFns.isToday(date)) {
            // - 当天，显示 HH:mm
            messageTimestamp = dateFns.format(date, 'HH:mm')
        } else if (dateFns.isThisYear(date)) {
            // - 当年，显示 MM-dd HH:mm
            messageTimestamp = dateFns.format(date, 'MM-dd HH:mm')
        } else {
            // - 其他年份：yyyy-MM-dd HH:mm
            messageTimestamp = dateFns.format(date, 'yyyy-MM-dd HH:mm')
        }

        tips.push('time: ' + messageTimestamp)
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

    // 是否需要渲染 Aritfact 组件
    const needArtifact = useMemo(() => {
        if (msg.role !== 'assistant') {
            return false
        }
        return isContainRenderableCode(msg.content)
    }, [msg.content, msg.role])

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
    useEffect(() => {
        if (msg.generating && autoScrollId) {
            if (needArtifact) {
                scrollActions.tickAutoScroll(autoScrollId)
                return
            }
            const viewportHeight = scrollActions.getMessageListViewportHeight()
            const currentHeight = ref.current?.clientHeight ?? 0
            if (currentHeight > viewportHeight) {
                // scrollActions.tickAutoScroll(autoScrollId)  // 清理之前，最后再滚动一次，确保非流式生成的消息也能滚动到底部
                scrollActions.scrollToMessage(msg.id, 'start')
                scrollActions.clearAutoScroll(autoScrollId)
                setAutoScrollId(null)
            } else {
                scrollActions.tickAutoScroll(autoScrollId)
            }
        }
    }, [msg.content, needArtifact])

    let content = msg.content   // 消息正文
    if (typeof msg.content !== 'string') {
        content = JSON.stringify(msg.content)
    }
    if (msg.generating) {
        content += '...'
    }
    if (needCollapse && isCollapsed) {
        content = msg.content.slice(0, collapseThreshold) + '... '
    }

    const CollapseButton = (
        <span
            className='cursor-pointer inline-block font-bold text-blue-500 hover:text-white hover:bg-blue-500'
            onClick={() => setIsCollapsed(!isCollapsed)}
        >
            [{isCollapsed ? t('Expand') : t('Collapse')}]
        </span>
    )

    const onClickAssistantAvatar = () => {
        setChatConfigDialog(props.sessionId)
    }

    return (
        <Box
            ref={ref}
            id={props.id}
            key={msg.id}
            className={cn(
                'group/message',
                'msg-block',
                'px-2 py-1.5',
                msg.generating ? 'rendering' : 'render-done',
                {
                    user: 'user-msg',
                    system: 'system-msg',
                    assistant: 'assistant-msg',
                }[msg?.role || 'user'],
                className,
                widthFull ? 'w-full' : 'max-w-4xl mx-auto',
            )}
            sx={{
                paddingBottom: '0.1rem',
                paddingX: '1rem',
                [theme.breakpoints.down('sm')]: {
                    paddingX: '0.3rem',
                },
            }}
        >
            <Grid container wrap="nowrap" spacing={1.5}>
                <Grid item>
                    <Box className={cn(msg.role !== 'assistant' ? 'mt-1' : 'mt-2')} >
                        {
                            {
                                assistant: currentSessionAssistantAvatarKey ? (
                                    <Avatar
                                        sx={{
                                            backgroundColor: theme.palette.primary.main,
                                            width: '28px',
                                            height: '28px',
                                        }}
                                        className='cursor-pointer'
                                        onClick={onClickAssistantAvatar}
                                    >
                                        <ImageInStorage storageKey={currentSessionAssistantAvatarKey}
                                            className='object-cover object-center w-full h-full' />

                                    </Avatar>
                                ) : currentSessionPicUrl ? (
                                    <Avatar
                                        src={currentSessionPicUrl}
                                        sx={{
                                            width: '28px',
                                            height: '28px',
                                        }}
                                        className='cursor-pointer'
                                        onClick={onClickAssistantAvatar}
                                    />
                                ) : props.sessionType === 'picture' ? (
                                    <Avatar
                                        sx={{
                                            backgroundColor: theme.palette.secondary.main,
                                            width: '28px',
                                            height: '28px',
                                        }}
                                        className='cursor-pointer'
                                        onClick={onClickAssistantAvatar}
                                    >
                                        <ImageIcon fontSize='small' />
                                    </Avatar>
                                ) : defaultAssistantAvatarKey ? (
                                    <Avatar
                                        sx={{
                                            backgroundColor: theme.palette.primary.main,
                                            width: '28px',
                                            height: '28px',
                                        }}
                                        className='cursor-pointer'
                                        onClick={onClickAssistantAvatar}
                                    >
                                        <ImageInStorage storageKey={defaultAssistantAvatarKey}
                                            className='object-cover object-center w-full h-full' />
                                    </Avatar>
                                ) : (
                                    <Avatar
                                        sx={{
                                            backgroundColor: theme.palette.primary.main,
                                            width: '28px',
                                            height: '28px',
                                        }}
                                        className='cursor-pointer'
                                        onClick={onClickAssistantAvatar}
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
                                        className='cursor-pointer'
                                        onClick={() => setOpenSettingWindow('chat')}
                                    >
                                        {
                                            userAvatarKey ? (
                                                <ImageInStorage storageKey={userAvatarKey}
                                                    className='object-cover object-center w-full h-full' />
                                            ) : (
                                                <PersonIcon fontSize='small' />
                                            )
                                        }
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
                        {
                            msg.status && msg.status.length > 0 && msg.status[0].type === 'sending_file' && (
                                <div className='flex flex-row items-start justify-start overflow-x-auto overflow-y-hidden'>
                                    <div className='flex justify-start items-center mb-1 px-1 py-2
                                                    border-solid border-blue-400/20 shadow-md rounded-lg
                                                    bg-blue-100
                                                    '
                                    >
                                        <Loader className='w-6 h-6 ml-1 mr-2 text-black animate-spin' />
                                        <span className='mr-4 animate-pulse font-bold text-gray-800/70'>
                                            {t('Reading file...')}
                                        </span>
                                    </div>
                                </div>
                            )
                        }
                        <div className={cn(
                            'max-w-full inline-block',
                            msg.role !== 'assistant'
                                ? 'bg-stone-400/10 dark:bg-blue-400/10 px-2 rounded '
                                : '',
                        )}>
                            <Box className={cn('msg-content', { 'msg-content-small': small })}
                                sx={
                                    small ? { fontSize: theme.typography.body2.fontSize } : {}
                                }
                            >
                                {
                                    enableMarkdownRendering && !isCollapsed ? (
                                        <Markdown
                                            enableLaTeXRendering={enableLaTeXRendering}
                                            enableMermaidRendering={enableMermaidRendering}
                                            generating={msg.generating}
                                            preferCollapsedCodeBlock={
                                                autoCollapseCodeBlock
                                                && (
                                                    preferCollapsedCodeBlock
                                                    || msg.role !== 'assistant'
                                                    || previewArtifact
                                                )
                                            }
                                        >
                                            {content}
                                        </Markdown>
                                    ) : (
                                        <div>
                                            <p>
                                                {content}
                                                {
                                                    needCollapse && isCollapsed && (
                                                        CollapseButton
                                                    )
                                                }
                                            </p>
                                        </div>
                                    )
                                }
                            </Box>
                            {msg.pictures && (
                                <div className='flex flex-row items-start justify-start overflow-x-auto overflow-y-hidden'>
                                    {
                                        msg.pictures.map((pic, index) => (
                                            <div
                                                key={index}
                                                className="w-[100px] min-w-[100px] h-[100px] min-h-[100px]
                                                    md:w-[200px] md:min-w-[200px] md:h-[200px] md:min-h-[200px]
                                                    p-1.5 mr-2 mb-2 inline-flex items-center justify-center
                                                    bg-white dark:bg-slate-800
                                                    border-solid border-slate-400/20 rounded-md
                                                    hover:cursor-pointer hover:border-slate-800/20 transition-all duration-200"
                                                onClick={() => setPictureShow({ picture: pic })}
                                            >
                                                {
                                                    pic.loading && !pic.storageKey && !pic.url && (
                                                        <CircularProgress className='block max-w-full max-h-full' color='secondary' />
                                                    )
                                                }
                                                {
                                                    pic.storageKey && (
                                                        <ImageInStorage className='w-full' storageKey={pic.storageKey} />
                                                    )
                                                }
                                                {
                                                    pic.url && (
                                                        <Img src={pic.url} className='w-full' />
                                                    )
                                                }
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                            {
                                msg.files && (
                                    <div className='flex flex-row items-start justify-start overflow-x-auto overflow-y-hidden pb-1'>
                                        {
                                            msg.files.map((file, index) => (
                                                <div key={index} className='flex justify-start items-center mb-2 p-1.5
                                                    border-solid border-slate-400/20 rounded 
                                                    bg-white dark:bg-slate-800
                                                    '
                                                >
                                                    <FileIcon filename={file.name} className='w-6 h-6 ml-1 mr-2 text-black dark:text-white' />
                                                    <Typography className='w-32' noWrap>
                                                        {file.name}
                                                    </Typography>
                                                </div>
                                            ))
                                        }
                                    </div>
                                )
                            }
                            <MessageErrTips msg={msg} />
                            {
                                needCollapse && !isCollapsed && CollapseButton
                            }
                            {
                                needArtifact && (
                                    <MessageArtifact
                                        sessionId={props.sessionId}
                                        messageId={msg.id}
                                        messageContent={msg.content}
                                        preview={previewArtifact}
                                        setPreview={setPreviewArtifact}
                                    />
                                )
                            }
                            {
                                tips.length > 0 && (
                                    <Typography variant="body2" sx={{ opacity: 0.5 }} className='pb-1'>
                                        {tips.join(', ')}
                                    </Typography>
                                )
                            }
                        </div>
                        {
                            !hiddenButtonGroup && (
                                <Box sx={{ height: '35px' }}>
                                    {/* <Box sx={{ height: '35px' }} className='opacity-0 group-hover/message:opacity-100 delay-100 transition-all duration-100'> */}
                                    <span className={cn(!anchorEl && !msg.generating ? 'hidden group-hover/message:inline-flex' : 'inline-flex')} >
                                        <ButtonGroup
                                            sx={{
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
                                            aria-label="message button group"
                                        >
                                            {msg.generating && (
                                                <Tooltip title={t('stop generating')} placement="top">
                                                    <IconButton aria-label="edit" color="warning" onClick={handleStop}>
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
                                                            onClick={handleRefresh}
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
                                                        onClick={handleRefresh}
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
                                                        setAnchorEl(null)
                                                        quoteMsg()
                                                    }}
                                                    disableRipple
                                                    divider
                                                >
                                                    <FormatQuoteIcon fontSize="small" />
                                                    {t('quote')}
                                                </MenuItem>
                                                <MenuItem key={msg.id + 'del'} onClick={onDelMsg} disableRipple
                                                    sx={{
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                                        },
                                                    }}
                                                >
                                                    <DeleteForeverIcon fontSize="small" />
                                                    {t('delete')}
                                                </MenuItem>
                                            </StyledMenu>
                                        </ButtonGroup>
                                    </span>
                                </Box>
                            )
                        }
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    )
}

export default function Message(props: Props) {
    return useMemo(() => {
        return <_Message {...props} />
    }, [props.msg])
}
