import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkBreaks from 'remark-breaks'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@mui/material'
import { useMemo, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { a11yDark, atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import * as toastActions from '../stores/toastActions'
import { sanitizeUrl } from '@braintree/sanitize-url'
import * as latex from '../packages/latex'

import 'katex/dist/katex.min.css' // `rehype-katex` does not import the CSS for you
import { copyToClipboard } from '@/packages/navigator'
import { MessageMermaid, SVGPreview } from './Mermaid'
import { ChevronsDownUp, Copy } from 'lucide-react'

export default function Markdown(props: {
    children: string
    enableLaTeXRendering?: boolean
    enableMermaidRendering?: boolean
    hiddenCodeCopyButton?: boolean
    className?: string
    generating?: boolean
    preferCollapsedCodeBlock?: boolean
}) {
    const {
        children,
        enableLaTeXRendering = true,
        enableMermaidRendering = true,
        hiddenCodeCopyButton,
        preferCollapsedCodeBlock,
        className,
        generating,
    } = props
    return useMemo(() => (
        <ReactMarkdown
            remarkPlugins={
                enableLaTeXRendering
                    ? [remarkGfm, remarkMath, remarkBreaks]
                    : [remarkGfm, remarkBreaks]
            }
            rehypePlugins={[rehypeKatex]}
            className={`break-words ${className || ''}`}
            // react-markdown 默认的 defaultUrlTransform 会错误地编码 URL 中的 Query，比如 & 会被编码成 &amp;
            // 这里改用 sanitizeUrl 库，同时也可以避免 XSS 攻击
            urlTransform={(url) => sanitizeUrl(url)}
            components={{
                code: (props: any) => CodeRenderer({
                    ...props,
                    hiddenCodeCopyButton,
                    enableMermaidRendering,
                    generating,
                    preferCollapsedCodeBlock,
                }),
                a: ({ node, ...props }) => (
                    <a
                        {...props}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                            e.stopPropagation()
                        }}
                    />
                ),
            }}
        >
            {
                enableLaTeXRendering
                    ? latex.processLaTeX(children)
                    : children
            }
        </ReactMarkdown>
    ), [children, enableLaTeXRendering, enableMermaidRendering])
}

export function CodeRenderer(props: {
    children: string
    className?: string
    hiddenCodeCopyButton?: boolean
    generating?: boolean
    enableMermaidRendering?: boolean
    preferCollapsedCodeBlock?: boolean
}) {
    const theme = useTheme()
    return useMemo(() => {
        const { children, className, hiddenCodeCopyButton, generating, enableMermaidRendering, preferCollapsedCodeBlock } = props
        const match = /language-(\w+)/.exec(className || '')
        const language = match?.[1] || 'text'
        if (!String(children).includes('\n')) {
            return (
                <InlineCode children={children} className={className} />
            )
        }
        if (language === 'mermaid' && enableMermaidRendering) {
            return (
                <MessageMermaid
                    source={String(children)}
                    theme={theme.palette.mode}
                    generating={generating}
                />
            )
        }
        if (language === 'svg') {
            return (
                <div>
                    <BlockCode
                        children={children}
                        hiddenCodeCopyButton={hiddenCodeCopyButton}
                        language={language}
                        preferCollapsed={true}
                    />
                    <SVGPreview
                        xmlCode={String(children)}
                        className='max-w-sm'
                        generating={generating}
                    />
                </div>
            )
        }
        return (
            <BlockCode
                children={children}
                hiddenCodeCopyButton={hiddenCodeCopyButton}
                language={language}
                preferCollapsed={preferCollapsedCodeBlock}
            />
        )
    }, [props.children, theme.palette.mode, props.enableMermaidRendering])
}

function InlineCode(props: {
    children: string
    className?: string
}) {
    const { children, className } = props
    const theme = useTheme()
    return (
        <code
            className={className}
            style={{
                backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f1f1f1',
                padding: '2px 4px',
                margin: '0 4px',
                borderRadius: '4px',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? '#444' : '#ddd',
            }}
        >
            {children}
        </code>
    )
}

function BlockCode(props: {
    language: string
    children: string
    hiddenCodeCopyButton?: boolean
    preferCollapsed?: boolean
}) {
    const { children, hiddenCodeCopyButton, preferCollapsed, language } = props
    const theme = useTheme()
    const { t } = useTranslation()

    const lines = String(children).split('\n')
    const shouldCollapse = lines.length > 6
    const [isCollapsed, setIsCollapsed] = useState(shouldCollapse && preferCollapsed)

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    backgroundColor: 'rgb(50, 50, 50)',
                    fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    borderTopLeftRadius: '0.3rem',
                    borderTopRightRadius: '0.3rem',
                    borderBottomLeftRadius: '0',
                    borderBottomRightRadius: '0',
                }}
            >
                <span
                    style={{
                        textDecoration: 'none',
                        color: 'gray',
                        padding: '2px',
                        margin: '2px 10px 0 10px',
                    }}
                >
                    {'<' + language.toUpperCase() + '>'}
                </span>
                <div className='flex items-center px-1'>
                    {!isCollapsed && shouldCollapse && (
                        <ChevronsDownUp
                            className='cursor-pointer text-white opacity-30 hover:bg-gray-800 hover:opacity-100 mx-1.5'
                            size={theme.typography.h5.fontSize}
                            onClick={(event) => {
                                event.stopPropagation() // 优化搜索窗口中的展开逻辑
                                event.preventDefault()
                                setIsCollapsed(!isCollapsed)
                            }}
                        />
                    )}
                    {!hiddenCodeCopyButton && (
                        <Copy
                            className='cursor-pointer text-white opacity-30 hover:bg-gray-800 hover:opacity-100 mx-1.5'
                            size={theme.typography.h5.fontSize}
                            onClick={(event) => {
                                event.stopPropagation() // 优化搜索窗口中的展开逻辑
                                event.preventDefault()
                                copyToClipboard(String(children))
                                toastActions.add(t('copied to clipboard'))
                            }}
                        />
                    )}
                </div>
            </div>
            <div style={{ position: 'relative' }}>
                <div className={isCollapsed ? 'max-h-28 overflow-hidden' : ''}>
                    <SyntaxHighlighter
                        children={children.replace(/\n$/, '')}
                        style={
                            theme.palette.mode === 'dark'
                                ? atomDark
                                : a11yDark
                        }
                        language={language}
                        PreTag="div"
                        customStyle={{
                            marginTop: '0',
                            margin: '0',
                            borderTopLeftRadius: '0',
                            borderTopRightRadius: '0',
                            borderBottomLeftRadius: '0.3rem',
                            borderBottomRightRadius: '0.3rem',
                            border: 'none',
                        }}
                    />
                </div>
                {isCollapsed && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '80px',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-end',
                            cursor: 'pointer',
                        }}
                        onClick={(event) => {
                            // 如果未来会保留每个会话的滚动位置，这里可以加一个简单的内存缓存来保持 code block 展开
                            event.stopPropagation() // 优化搜索窗口中的展开逻辑
                            event.preventDefault()
                            setIsCollapsed(false)
                        }}
                    >
                        <span className='text-white mb-2 font-bold'>
                            {t('Show all ({{x}})', { x: lines.length })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
