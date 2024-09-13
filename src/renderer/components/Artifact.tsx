import { ButtonGroup, IconButton } from "@mui/material"
import { debounce } from "lodash"
import { useEffect, useMemo, useRef, useState } from "react"
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import { useIsSmallScreen } from "@/hooks/useScreenChange";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import * as sessionActions from '@/stores/sessionActions'
import { useAtomValue, useSetAtom } from "jotai";
import * as atoms from '@/stores/atoms'
import FullscreenIcon from "./icons/FullscreenIcon";
import ArrowRightIcon from "./icons/ArrowRightIcon";

const CODE_BLOCK_LANGUAGES = ['html', 'js', 'javascript', 'css', 'svg'] as const
export type CodeBlockLanguage = (typeof CODE_BLOCK_LANGUAGES)[number]

export function MessageArtifact(props: {
    sessionId: string
    messageId: string
    messageContent: string
}) {
    const { sessionId, messageId, messageContent } = props
    const autoPreviewArtifacts = useAtomValue(atoms.autoPreviewArtifactsAtom)
    const contextMessages = useMemo(() => {
        return sessionActions.getMessageThreadContext(sessionId, messageId)
    }, [sessionId, messageId])
    const htmlCode = useMemo(() => {
        return generateHtml([
            ...contextMessages.map(m => m.content),
            messageContent,
        ])
    }, [contextMessages, messageContent])
    if (!htmlCode) {
        return null
    }
    if (!isContainRenderingCode(messageContent)) {
        return null
    }
    return (
        <ArtifactWithButtons htmlCode={htmlCode} defaultPreview={autoPreviewArtifacts} />
    )
}

export function ArtifactWithButtons(props: {
    htmlCode: string
    defaultPreview?: boolean
}) {
    const { htmlCode, defaultPreview } = props
    const { t } = useTranslation()
    const [preview, setPreview] = useState(!!defaultPreview)
    const [reloadSign, setReloadSign] = useState(0)
    const isSmallScreen = useIsSmallScreen()
    const setArtifactDialogHtmlCode = useSetAtom(atoms.artifactDialogHtmlCodeAtom)

    const onReplay = () => {
        setReloadSign(Math.random())
    }
    const onPreview = () => {
        setPreview(true)
        setReloadSign(Math.random())
    }
    const onStopPreview = () => {
        setPreview(false)
    }
    const onOpenFullscreen = () => {
        setArtifactDialogHtmlCode(htmlCode)
    }
    if (!preview) {
        return (
            <div className="w-full my-1 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 cursor-pointer overflow-hidden group"
                onClick={onPreview}
            >
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <span className="text-lg font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                            {t('Preview')}
                        </span>
                    </div>
                    <div className="flex items-center justify-center">
                        <FullscreenIcon className="mr-1 hover:bg-white hover:rounded  hover:text-gray-500
                            p-1 w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onOpenFullscreen()
                            }}
                        />
                        <ArrowRightIcon className="hover:bg-white hover:rounded  hover:text-gray-500
                            p-1 w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                            onClick={() => setPreview(true)}
                        />
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className={cn(
            "w-full",
            'border border-solid rounded border-gray-500/40',
            'flex',
            isSmallScreen ? 'flex-col-reverse' : 'flex-row',
        )}>
            <Artifact htmlCode={htmlCode} reloadSign={reloadSign} />
            <ButtonGroup orientation={isSmallScreen ? "horizontal" : "vertical"}
                className={cn(
                    "border-solid border-gray-500/20",
                    isSmallScreen
                        ? 'border-r-0 border-b-1 border-l-0 border-t-0'
                        : 'border-r-0 border-b-0 border-l-1 border-t-0'
                )}
            >
                <IconButton onClick={onReplay} color="primary">
                    <ReplayOutlinedIcon />
                </IconButton>
                <IconButton onClick={onOpenFullscreen} color="primary">
                    <FullscreenIcon className="w-5 h-5" />
                </IconButton>
                <IconButton onClick={onStopPreview} color="error">
                    <StopCircleOutlinedIcon />
                </IconButton>
            </ButtonGroup>
        </div>
    )
}

export function Artifact(props: {
    htmlCode: string
    reloadSign?: number
    className?: string
}) {
    const { htmlCode, reloadSign, className } = props
    const ref = useRef<HTMLIFrameElement>(null)
    const iframeOrigin = "https://chatbox-artifacts.pages.dev/preview"

    const sendIframeMsg = (type: 'html', code: string) => {
        if (!ref.current) {
            return
        }
        ref.current.contentWindow?.postMessage({ type, code }, "*")
    }
    // 当 reloadSign 改变时，重新加载 iframe 内容
    useEffect(() => {
        sendIframeMsg('html', '')
        sendIframeMsg('html', htmlCode)
    }, [reloadSign])

    // 当 htmlCode 改变时，防抖地刷新 iframe 内容
    const updateIframe = debounce(() => {
        sendIframeMsg('html', htmlCode)
    }, 300)
    useEffect(() => {
        updateIframe()
        return () => updateIframe.cancel()
    }, [htmlCode])

    return (
        <iframe
            className={cn('w-full', 'border-none', 'h-[400px]', className)}
            sandbox='allow-scripts allow-forms'
            src={iframeOrigin}
            ref={ref}
        />
    )
}

function generateHtml(markdowns: string[]): string {
    const codeBlocks: Record<CodeBlockLanguage, string[]> = {
        html: [],
        js: [],
        javascript: [],
        css: [],
        svg: [],
    }
    const languages = Array.from(Object.keys(codeBlocks)) as (keyof typeof codeBlocks)[]
    let currentType: keyof typeof codeBlocks | null = null
    let currentContent = ''
    for (const markdown of markdowns) {
        for (let line of markdown.split('\n')) {
            line = line.trimStart()
            const lang = languages.find(l => '```' + l === line)
            if (lang) {
                currentType = lang
                continue
            }
            if (line === '```') {
                if (currentContent && currentType) {
                    codeBlocks[currentType].push(currentContent)
                    currentContent = ''
                    currentType = null
                    continue
                } else {
                    continue
                }
            }
            if (currentType) {
                currentContent += line + '\n'
                continue
            }
        }
    }
    // 仅保留最后一个
    // const htmlWholes = codeBlocks.html.filter(c => c.includes('</html>'))
    // codeBlocks.html = [
    //     htmlWholes[htmlWholes.length - 1],
    //     ...codeBlocks.html.filter(c => !c.includes('</html>'))
    // ]

    codeBlocks.html = codeBlocks.html.slice(-1)
    codeBlocks.css = codeBlocks.css.slice(-1)
    codeBlocks.javascript = codeBlocks.javascript.slice(-1)
    codeBlocks.js = codeBlocks.js.slice(-1)
    codeBlocks.svg = codeBlocks.svg.slice(-1)

    if (codeBlocks.html.length === 0 && codeBlocks.svg.length === 0) {
        return ''
    }

    const srcDoc = `
<script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp,container-queries"></script>

${codeBlocks.html.join('\n')}
${codeBlocks.svg.join('\n')}

<style>
${codeBlocks.css.join('\n')}
</style>

<script>
${codeBlocks.js.join('\n\n// ----------- \n\n')}
${codeBlocks.javascript.join('\n\n// ----------- \n\n')}
</script>
    `
    return srcDoc
}

function isContainRenderingCode(markdown: string): boolean {
    return CODE_BLOCK_LANGUAGES.some(l => markdown.includes('```' + l))
        || CODE_BLOCK_LANGUAGES.some(l => markdown.includes('```' + l.toUpperCase()))
}
