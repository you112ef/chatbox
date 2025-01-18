import { getOS } from '@/packages/navigator'
import { useTranslation } from 'react-i18next'
import { Settings, ShortcutName, ShortcutSetting } from '../../shared/types'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, IconButton, Tooltip } from '@mui/material'
import * as defaults from '../../shared/defaults'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import DeleteIcon from '@mui/icons-material/Delete'
import { useRecordHotkeys } from 'react-hotkeys-hook'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'
import WarningIcon from '@mui/icons-material/Warning'
import cn from 'classnames'

const os = getOS()

function formatKey(key: string) {
    const COMMON_KEY_MAPS: Record<string, string> = {
        ctrl: 'Ctrl',
        command: 'Ctrl',
        mod: 'Ctrl',
        option: 'Alt',
        alt: 'Alt',
        shift: 'Shift',
        enter: '⏎',
        tab: 'Tab',
        up: '↑',
        down: '↓',
        left: '←',
        right: '→'
    }
    const MAC_KEY_MAPS: Record<string, string> = {
        ...COMMON_KEY_MAPS,
        meta: '⌘',
        mod: '⌘',
        command: '⌘',
        option: '⌥',
        alt: '⌥',
        tab: '⇥',
        // shift: '⇧',
    }
    const WINDOWS_KEY_MAPS: Record<string, string> = {
        ...COMMON_KEY_MAPS,
        meta: 'Win',
        // command: 'Win',
    }
    const LINUX_KEY_MAPS: Record<string, string> = {
        ...COMMON_KEY_MAPS,
        meta: 'Super',
        mod: 'Super',
        command: 'Super',
    }
    if (!key) {
        return ''
    }
    const lowercaseKey = key.toLowerCase()
    const keyLabel = key.length === 1 ? key.toUpperCase() : key
    switch (os) {
        case 'Mac':
            return MAC_KEY_MAPS[lowercaseKey] || keyLabel
        case 'Windows':
            return WINDOWS_KEY_MAPS[lowercaseKey] || keyLabel
        case 'Linux':
            return LINUX_KEY_MAPS[lowercaseKey] || keyLabel
        default:
            return COMMON_KEY_MAPS[lowercaseKey] || keyLabel
    }
}

export function Keys(props: {
    keys: string[]
    size?: 'small'
    opacity?: number
    onEdit?: () => void
    className?: string
}) {
    // const sizeClass = props.size === 'small' ? 'text-[0.55rem]' : 'text-sm'
    const sizeClass = 'text-xs'
    const opacityClass = props.opacity !== undefined ? `opacity-${props.opacity * 100}` : ''
    return (
        <span className={`inline-block px-1 font-mono whitespace-nowrap ${sizeClass} ${opacityClass} ${props.className || ''}`}>
            {props.keys.map((key, index) => (
                <Key key={index}>{formatKey(key)}</Key>
            ))}
        </span>
    )
}

function Key(props: { children: React.ReactNode }) {
    return (
        <code className="inline-block px-1 mx-[1px] border border-solid border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            {props.children}
        </code>
    )
}

type ShortcutDataItem = {
    label: string
    name?: ShortcutName
    keys: ShortcutSetting[ShortcutName]
}

export function ShortcutConfig(props: {
    shortcuts: Settings['shortcuts']
    setShortcuts: (shortcuts: Settings['shortcuts']) => void
}) {
    const { shortcuts, setShortcuts } = props
    const { t } = useTranslation()
    const items: ShortcutDataItem[] = [
        {
            label: t('Show/Hide the Application Window'),
            name: 'windowQuickToggle',
            keys: shortcuts.windowQuickToggle,
        },
        {
            label: t('Focus on the Input Box'),
            name: 'inputBoxFocus',
            keys: shortcuts.inputBoxFocus,
        },
        {
            label: t('Focus on the Input Box and Enter Web Browsing Mode'),
            name: 'inputBoxWebBrowsingMode',
            keys: shortcuts.inputBoxWebBrowsingMode,
        },
        {
            label: t('Send'),
            name: 'inputBoxSend',
            keys: shortcuts.inputBoxSend,
        },
        // {
        //     label: t('Insert a New Line into the Input Box'),
        //     // name: 'inputBoxInsertNewLine',
        //     keys: shortcuts.inputBoxInsertNewLine,
        // },
        {
            label: t('Send Without Generating Response'),
            name: 'inputBoxSendWithoutResponse',
            keys: shortcuts.inputBoxSendWithoutResponse,
        },
        {
            label: t('Create a New Conversation'),
            name: 'newChat',
            keys: shortcuts.newChat,
        },
        {
            label: t('Create a New Image-Creator Conversation'),
            name: 'newPictureChat',
            keys: shortcuts.newPictureChat,
        },
        {
            label: t('Navigate to the Next Conversation'),
            name: 'sessionListNavNext',
            keys: shortcuts.sessionListNavNext,
        },
        {
            label: t('Navigate to the Previous Conversation'),
            name: 'sessionListNavPrev',
            keys: shortcuts.sessionListNavPrev,
        },
        {
            label: t('Navigate to the Specific Conversation'),
            // name: 'sessionListNavTargetIndex',
            keys: 'mod+1-9',
        },
        {
            label: t('Refresh Context, Start a New Thread'),
            name: 'messageListRefreshContext',
            keys: shortcuts.messageListRefreshContext,
        },
        {
            label: t('Show/Hide the Search Dialog'),
            name: 'dialogOpenSearch',
            keys: shortcuts.dialogOpenSearch,
        },
        {
            label: t('Navigate to the Previous Option (in search dialog)'),
            // name: 'optionNavUp',
            keys: shortcuts.optionNavUp,
        },
        {
            label: t('Navigate to the Next Option (in search dialog)'),
            // name: 'optionNavDown',
            keys: shortcuts.optionNavDown,
        },
        {
            label: t('Select the Current Option (in search dialog)'),
            // name: 'optionSelect',
            keys: shortcuts.optionSelect,
        }
    ]
    const isConflict = (name: ShortcutName, shortcut: string) => {
        for (const item of items) {
            if (item.name && item.name !== name && item.keys === shortcut) {
                return true
            }
        }
        return false
    }
    return (
        <TableContainer component={Paper}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                <ConfirmDeleteButton
                    onDelete={() => {
                        setShortcuts(defaults.settings().shortcuts)
                    }}
                    icon={<RestartAltIcon />}
                    label={t('Reset All Hotkeys')}
                    color="warning"
                />
            </Box>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>{t('Action')}</TableCell>
                        <TableCell align="center">{t('Hotkeys')}</TableCell>
                        <TableCell align="right">{t('Operations')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map(({ name, label, keys }, itemIndex) =>
                        <TableRow key={`${name}-${itemIndex}`}>
                            <TableCell>
                                <Typography variant="body2" className="text-sm">
                                    {label}
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Box className="inline-flex gap-0.5">
                                    <ShortcutText
                                        shortcut={keys}
                                        isConflict={
                                            name
                                                ? isConflict(name, keys)
                                                : false
                                        }
                                        setShortcut={
                                            name
                                                ? (shortcut) => {
                                                    setShortcuts({ ...shortcuts, [name]: shortcut })
                                                }
                                                : undefined
                                        }
                                        className={cn(
                                            'rounded px-2 py-1',
                                            name
                                                ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ease-in-out'
                                                : 'cursor-not-allowed'
                                        )}
                                    />
                                </Box>
                            </TableCell>
                            <TableCell align="right">
                                {
                                    name && (
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setShortcuts({
                                                        ...shortcuts,
                                                        [name]: defaults.settings().shortcuts[name]
                                                    })
                                                }}
                                            >
                                                <RestartAltIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    setShortcuts({ ...shortcuts, [name]: '' })
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    )
                                }
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

function ShortcutText(props: {
    shortcut: string,
    setShortcut?: (shortcut: string) => void
    isConflict?: boolean
    className?: string
}) {
    const { shortcut, setShortcut, isConflict, className } = props
    const { t } = useTranslation()
    const [keys, { start, stop, isRecording }] = useRecordHotkeys()
    // 已知问题：
    // 无法在 MacOS 录制 ctrl+space，因为与系统快捷键“切换输入法”冲突
    // 无法实现录制 cmd+`，即使自行编写原生实现也无法录制
    // MacOS 无法录制 ctrl+space 和 cmd+space，因为和系统切换输入法、聚焦搜索冲突，只能录制 option+space
    // Windows 无法录制 alt+space，因为和聚焦搜索冲突，可以录制 ctrl+space 不过和系统切换快捷键冲突。
    // Windows 可以录制 win+space 但无法生效，因为和系统快捷键冲突。
    const onKeyUp = (e: React.KeyboardEvent) => {
        e.preventDefault()  // 阻止默认行为
        if (!setShortcut) {
            return
        }
        // 修复 useRecordHotkeys 会遗漏 Enter 键的问题
        if (e.key === 'Enter' && !keys.has('enter')) {
            keys.add('enter')
        }
        // 修复 useRecordHotkeys 会将 ` 键录制成 backquote 的问题
        if (keys.has('backquote')) {
            keys.delete('backquote')
            keys.add('`')
        }
        // 修复 windows 下无法录制 Ctrl+space 的问题
        if (e.key === ' ' && !keys.has('space')) {
            keys.add('space')
        }
        // 当所有按键都释放时,结束录制
        if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
            if (keys.size > 0) {
                setShortcut(
                    Array.from(keys)
                        .map(key => {
                            if (os === 'Mac' && key === 'meta') {
                                return 'mod' // 在 Mac 上，command 键被录制成 meta 键
                            }
                            return key
                        })
                        .join('+')
                )
            }
            stop()
        }
    }
    if (isRecording && setShortcut) {
        return (
            <span className="inline-flex items-center gap-1 px-2 text-xs">
                <input
                    type="text"
                    autoFocus
                    value={
                        keys.size > 0
                            ? Array.from(keys).map(formatKey).join('')
                            : ''
                    }
                    placeholder={t('Press hotkey') || ''}
                    onKeyUp={onKeyUp}
                    onBlur={() => {
                        stop()
                    }}
                    className="w-24 px-1 py-1 text-xs font-mono text-black dark:text-white
                    bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
            </span>
        )
    }
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs ${className || ''}`}
            onClick={() => start()}
        >
            {shortcut && shortcut.length > 0 ? (
                <>
                    <Keys keys={shortcut.split('+')} />
                    {isConflict && (
                        <WarningIcon
                            sx={{
                                color: 'warning.main',
                                fontSize: '16px'
                            }}
                        />
                    )}
                </>
            ) : (
                <span className="opacity-50">
                    {t('Press hotkey')}
                </span>
            )}
        </span>
    )
}
