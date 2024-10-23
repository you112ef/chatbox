import { useSetAtom } from "jotai"
import mermaid from "mermaid"
import { useEffect, useState, useMemo } from "react"
import * as atoms from "@/stores/atoms"
import { ChartBarStacked } from "lucide-react"
import { Img } from "./Image"
import platform from "@/platform"
import { cn } from "@/lib/utils"

export function MessageMermaid(props: {
    source: string,
    theme: 'light' | 'dark',
    generating?: boolean
}) {
    const { source, theme, generating } = props

    const [svgCode, setSvgCode] = useState('')
    useEffect(() => {
        if (generating) {
            return
        }
        (async () => {
            const svgCode = await mermaidCodeToSvgCode(source, theme)
            setSvgCode(svgCode)
        })()
    }, [source, theme, generating])

    if (generating) {
        // 测试下来，发现这种方法是视觉效果最好的。
        // 如果根据 mermaid 是否正常渲染来判断，有时候残缺的 mermaid 也可以渲染出部分图形，这会造成视觉上的闪屏混乱。
        return <Loading />
    }

    return (
        <SVGPreview xmlCode={svgCode} />
    )
}

export function Loading() {
    return (
        <div className="inline-flex items-center gap-2 border border-solid border-gray-500 rounded-md p-2 my-2">
            <ChartBarStacked size={30} strokeWidth={1} />
            <span>Loading...</span>
        </div>
    )
}

export function SVGPreview(props: {
    xmlCode: string
    className?: string
    generating?: boolean
}) {
    const { xmlCode, className, generating } = props
    const setPictureShow = useSetAtom(atoms.pictureShowAtom)
    const svgBase64 = useMemo(
        () => {
            if (!xmlCode.includes('</svg') && generating) {
                return ''
            }
            try {
                return svgCodeToBase64(xmlCode)
            } catch (e) {
                console.error(e)
                return ''
            }
        },
        [xmlCode, generating],
    )
    if (!svgBase64) {
        return <Loading />
    }
    return (
        <div
            className={cn("cursor-pointer my-2", className)}
            onClick={async () => {
                setPictureShow({
                    picture: { url: svgBase64 },
                    onSave: async () => {
                        const pngBase64 = await svgToPngBase64(svgBase64)
                        const basename = `export_${Math.random().toString(36).substring(7)}`
                        await platform.exporter.exportImageFile(basename, pngBase64)
                    },
                })
            }}
        >
            <Img src={svgBase64} />
        </div>
    )
}

async function mermaidCodeToSvgCode(source: string, theme: 'light' | 'dark') {
    mermaid.initialize({ theme: theme === 'light' ? 'default' : 'dark' })
    const result = await mermaid.render('mermaidtmp', source)
    // 经过测试，发现 dompurify.sanitize 有时候会导致最终的 svg 显示不完整
    // 考虑到现代浏览器都不会执行 svg 中的 script 标签，所以这里不进行 sanitize。参考：https://stackoverflow.com/questions/7917008/xss-when-loading-untrusted-svg-using-img-tag
    // return dompurify.sanitize(result.svg, { USE_PROFILES: { svg: true, svgFilters: true } })
    return result.svg
}

function svgCodeToBase64(svgCode: string) {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgCode)));
}

async function svgToPngBase64(svgBase64: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 10;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('cannot get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0);
            try {
                const pngBase64 = canvas.toDataURL('image/png', 1.0); // 使用最高质量设置
                resolve(pngBase64);
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = (error) => {
            reject(error);
        };
        img.src = svgBase64
    });
}
