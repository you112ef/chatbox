export function Shortcut(props: { keys: string[] }) {
    const Keys: React.ReactNode[] = []
    for (let i = 0; i < props.keys.length; i++) {
        const key = props.keys[i]
        Keys.push(<Code>{key}</Code>)
        if (i !== props.keys.length - 1) {
            Keys.push(<span>+</span>)
        }
    }
    return <span style={{ display: 'inline-block', padding: '0 4px' }}>{Keys}</span>
}

export function Code(props: { children: React.ReactNode }) {
    return (
        <code
            style={{
                display: 'inline-block',
                padding: '0 4px',
                color: 'primary',
                border: '1px solid',
                borderColor: 'var(--muidocs-palette-grey-200, #DAE2ED)',
                borderRadius: '5px',
                fontSize: '0.8125rem',
                direction: 'ltr',
            }}
        >
            {props.children}
        </code>
    )
}
