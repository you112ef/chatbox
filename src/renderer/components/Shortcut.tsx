import { getOS } from '@/packages/navigator'

const os = getOS()

function convert(key: string) {
    if (['ctrl', 'command', '⌘'].includes(key.toLowerCase())) {
        if (os === 'Mac') {
            return '⌘'
        } else {
            return 'Ctrl'
        }
    }
    if (['option', 'alt', '⌥'].includes(key.toLowerCase())) {
        if (os === 'Mac') {
            return '⌥'
        } else {
            return 'Alt'
        }
    }
    if (['shift', '⇧'].includes(key.toLowerCase())) {
        return 'Shift'
        // 容易和方向键弄混淆
        // if (os === 'Mac') {
        //     return '⇧'
        // } else {
        //     return 'Shift'
        // }
    }
    if (['enter', '↩', '⏎'].includes(key.toLowerCase())) {
        return '⏎'
    }
    if (['tab', '⇥'].includes(key.toLowerCase())) {
        if (os === 'Mac') {
            return '⇥'
        } else {
            return 'Tab'
        }
    }
    return key
}

export function Shortcut(props: { keys: string[]; size?: 'small'; opacity?: number }) {
    const style: React.CSSProperties = {
        display: 'inline-block',
        padding: '0 4px',
        fontSize: '0.8125rem',
        fontFamily: 'Consolas, "Liberation Mono", Menlo, Courier, monospace',
    }
    if (props.size === 'small') {
        style.fontSize = '0.55rem'
    }
    if (props.opacity !== undefined) {
        style.opacity = props.opacity
    }
    return (
        <span style={style}>
            {props.keys.map((key, index) => (
                <Code key={index}>{convert(key)}</Code>
            ))}
        </span>
    )
}

function Code(props: { children: React.ReactNode }) {
    const style: React.CSSProperties = {
        display: 'inline-block',
        padding: '0 4px',
        border: '1px solid',
        borderColor: 'var(--muidocs-palette-grey-200, #DAE2ED)',
        borderRadius: '5px',
        direction: 'ltr',
        margin: '0 1px',
    }
    return <code style={style}>{props.children}</code>
}
