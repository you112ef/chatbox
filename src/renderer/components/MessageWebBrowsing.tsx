import { MessageWebBrowsing } from "src/shared/types"
import { Globe, ExternalLink } from 'lucide-react'
import LinkTargetBlank from "./Link"
import { useMemo } from "react"

export default function MessageWebBrowsing(props: { webBrowsing: MessageWebBrowsing }) {
    const { webBrowsing } = props
    if (!webBrowsing.links || webBrowsing.links.length === 0) {
        return null
    }
    return useMemo(() => <WebBrowsingCard {...props} />, [webBrowsing])
}

function WebBrowsingCard(props: { webBrowsing: MessageWebBrowsing }) {
    const { webBrowsing } = props
    return (
        <div className="flex flex-col gap-1.5 mt-1.5 p-2 rounded bg-blue-50/80 dark:bg-blue-900/20 border border-blue-300/30 dark:border-blue-600/30">
            <div className="flex items-center gap-1.5 px-0.5 text-xs text-gray-600 dark:text-gray-300">
                <Globe className="w-3 h-3 text-blue-600 dark:text-blue-500 flex-shrink-0" />
                <span className="font-medium bg-blue-100/80 dark:bg-blue-500/20 px-2 py-0.5 rounded-full truncate opacity-80">
                    {webBrowsing.query.join(', ')}
                </span>
            </div>
            <div className="px-0.5">
                {webBrowsing.links.map((link, index) => (
                    <div key={index}>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                            [{index + 1}]
                        </span>
                        <LinkTargetBlank
                            key={index}
                            href={link.url}
                            className="text-xs py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded px-1.5"
                        >
                            <span className="whitespace-pre-wrap flex-1">
                                {link.title}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 ml-1.5 text-gray-500 flex-shrink-0" />
                        </LinkTargetBlank>
                    </div>
                ))}
            </div>
        </div>
    )
}
