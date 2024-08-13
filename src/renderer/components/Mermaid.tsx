import { useSetAtom } from "jotai"
import mermaid from "mermaid"
import { useEffect } from "react"
import * as atoms from "@/stores/atoms"
import { cn } from "@/lib/utils"
import { ChartBarStacked } from "lucide-react"

export function Mermaid(props: {
    source: string
    theme: 'light' | 'dark'
    className?: string
}) {
    const { source, theme, className } = props
    useEffect(() => {
        mermaid.initialize({
            theme: theme === 'light' ? 'default' : 'dark',
        })
        mermaid.contentLoaded()
    }, [source, theme])
    return (
        <div className={cn(
            "mermaid",
            className,
        )}>
            {source}
        </div>
    )
}

export function MessageMermaid(props: { source: string, theme: 'light' | 'dark', generating?: boolean }) {
    const setMermaidDialogSource = useSetAtom(atoms.mermaidDialogSourceAtom)
    if (props.generating) {
        // 测试下来，发现这种方法是视觉效果最好的。
        // 如果根据 mermaid 是否正常渲染来判断，有时候残缺的 mermaid 也可以渲染出部分图形，这会造成视觉上的闪屏混乱。
        return (
            <div className="inline-flex items-center gap-2 border border-solid border-gray-500 rounded-md p-2">
                <ChartBarStacked size={30} strokeWidth={1} />
                <span>Loading...</span>
            </div>
        )
    }
    return (
        <div
            className="cursor-pointer"
            onClick={() => setMermaidDialogSource(props.source)}
        >
            <Mermaid source={props.source} theme={props.theme} />
        </div>
    )
}
