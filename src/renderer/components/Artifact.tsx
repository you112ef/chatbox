import { ButtonGroup, IconButton } from "@mui/material"
import { debounce } from "lodash"
import { useEffect, useMemo, useRef, useState } from "react"
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import { useIsSmallScreen } from "@/hooks/useScreenChange";
import { cn } from "@/lib/utils";
import { PlayIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import * as sessionActions from '@/stores/sessionActions'

export type CodeBlockLanguage = 'html' | 'js' | 'javascript' | 'css'

export function MessageArtifact(props: {
    sessionId: string
    messageId: string
    messageContent: string
}) {
    const { sessionId, messageId, messageContent } = props
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
        <Artifact htmlCode={htmlCode} defaultPreview />
    )
}

export function Artifact(props: {
    htmlCode: string
    defaultPreview?: boolean
}) {
    const { htmlCode, defaultPreview } = props
    const { t } = useTranslation()
    const [preview, setPreview] = useState(!!defaultPreview)
    const isSmallScreen = useIsSmallScreen()
    const ref = useRef<HTMLIFrameElement>(null)

    const sendIframeMsg = (type: 'html', code: string) => {
        if (!ref.current) {
            return
        }
        ref.current.contentWindow?.postMessage({ type, code }, "*")
    }

    const updateIframe = debounce(() => {
        sendIframeMsg('html', htmlCode)
    }, 1000)
    useEffect(() => {
        updateIframe()
    }, [htmlCode])

    const onReplay = () => {
        sendIframeMsg('html', '')
        sendIframeMsg('html', htmlCode)
    }

    const onStop = () => {
        sendIframeMsg('html', '')
        setPreview(false)
    }

    const iframeOrigin = "https://chatbox-artifacts.pages.dev/preview"

    if (!preview) {
        return (
            <div className='w-full rounded h-28 cursor-pointer
                flex justify-center items-center
                bg-slate-400/20 hover:bg-slate-400/30'
                onClick={() => setPreview(true)}
            >
                <PlayIcon className='w-6 h-6 opacity-70' />
                <span className="text-xl font-thin opacity-70">{t('Preview')}</span>
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
            <iframe
                className={cn('w-full', 'border-none', 'h-[400px]')}
                sandbox='allow-scripts allow-forms'
                src={iframeOrigin}
                ref={ref}
            />
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
                <IconButton onClick={onStop} color="error">
                    <StopCircleOutlinedIcon />
                </IconButton>
            </ButtonGroup>
        </div>
    )
}

function generateHtml(markdowns: string[]): string {
    const codeBlocks: Record<CodeBlockLanguage, string[]> = {
        html: [],
        js: [],
        javascript: [],
        css: [],
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

    if (codeBlocks.html.length === 0) {
        return ''
    }

    const srcDoc = `
${codeBlocks.html.join('\n')}

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
    return markdown.includes('```html')
        || markdown.includes('```js')
        || markdown.includes('```javascript')
        || markdown.includes('```css')
}
