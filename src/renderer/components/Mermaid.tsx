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

    const [svgId, setSvgId] = useState('')
    const [svgCode, setSvgCode] = useState('')
    useEffect(() => {
        if (generating) {
            return
        }
        (async () => {
            const { id, svg } = await mermaidCodeToSvgCode(source, theme)
            setSvgCode(svg)
            setSvgId(id)
        })()
    }, [source, theme, generating])

    if (generating) {
        // 测试下来，发现这种方法是视觉效果最好的。
        // 如果根据 mermaid 是否正常渲染来判断，有时候残缺的 mermaid 也可以渲染出部分图形，这会造成视觉上的闪屏混乱。
        return <Loading />
    }

    return (
        // <SVGPreview xmlCode={svgCode} />
        <SVGPreviewDangerous svgId={svgId} xmlCode={svgCode} />
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

/**
 * 直接将 svg 代码注入到页面中，通过浏览器自身的修复能力处理 svg 代码，再通过 serializeToString 得到规范的 svg 代码。
 * 经过各种测试，发现有时候 mermaid 生成的 svg 代码并不规范，直接转化 base64 将无法完整显示。
 * 这里的做法是直接将 svg 代码注入到页面中，通过浏览器自身的修复能力处理 svg 代码，再通过 serializeToString 得到规范的 svg 代码。
 */
export function SVGPreviewDangerous(props: {
    xmlCode: string
    svgId: string
    className?: string
    generating?: boolean
}) {
    const { svgId, xmlCode, className, generating } = props
    const setPictureShow = useSetAtom(atoms.pictureShowAtom)
    if (!xmlCode.includes('</svg') && generating) {
        return <Loading />
    }
    return (
        <div
            className={cn("cursor-pointer my-2", className)}
            onClick={async () => {
                const svg = document.getElementById(svgId)
                if (!svg) {
                    return
                }
                const serializedSvgCode = new XMLSerializer().serializeToString(svg)
                const base64 = svgCodeToBase64(serializedSvgCode)
                const pngBase64 = await svgToPngBase64(base64)
                setPictureShow({
                    picture: { url: pngBase64 },
                })
            }}
        >
            {/* 这里直接注入了 svg 代码 */}
            <div dangerouslySetInnerHTML={{ __html: xmlCode }} />
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
                // 图片预览窗口中直接显示 png 图片。因为在实际测试中发现，桌面端无法正常显示 SVG 图片，但网页端可以。
                const pngBase64 = await svgToPngBase64(svgBase64)
                setPictureShow({
                    picture: { url: pngBase64 },
                })
            }}
        >
            <Img src={svgBase64} />
        </div>
    )
}

async function mermaidCodeToSvgCode(source: string, theme: 'light' | 'dark') {
    mermaid.initialize({ theme: theme === 'light' ? 'default' : 'dark' })
    const id = 'mermaidtmp' + Math.random().toString(36).substring(2, 15)
    const result = await mermaid.render(id, source)
    // 考虑到 mermaid 工具内部本身已经使用了 dompurify 进行处理，因此可以先假设它的输出是安全的
    // 经过测试，发现 dompurify.sanitize 有时候会导致最终的 svg 显示不完整
    // 考虑到现代浏览器都不会执行 svg 中的 script 标签，所以这里不进行 sanitize。参考：https://stackoverflow.com/questions/7917008/xss-when-loading-untrusted-svg-using-img-tag
    // return dompurify.sanitize(result.svg, { USE_PROFILES: { svg: true, svgFilters: true } })
    return { id, svg: result.svg }
}

function svgCodeToBase64(svgCode: string) {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgCode)));
}

async function svgToPngBase64(svgBase64: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width
            let height = img.height
            try {
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(atob(svgBase64.split(',')[1]), 'image/svg+xml');
                const svgElement = svgDoc.documentElement;
                const viewBox = svgElement.getAttribute('viewBox');
                if (viewBox) {
                    const items = viewBox.split(/[\s,]+/)
                    if (items.length === 4) {
                        const [, , viewBoxWidth, viewBoxHeight] = items.map(item => parseFloat(item))
                        if (viewBoxWidth && viewBoxHeight) {    // 检查NaN
                            width = Math.max(viewBoxWidth, img.width)
                            height = Math.max(viewBoxHeight, img.height)
                            // console.log('viewBoxWidth', viewBoxWidth, 'viewBoxHeight', viewBoxHeight)
                        }
                    }
                }
            } catch (e) {
                console.error(e)
            }
            // console.log('img.width', img.width, 'img.height', img.height)
            // console.log('width', width, 'height', height)

            const canvas = document.createElement('canvas');
            const scale = 2;
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('cannot get canvas context'));
                return;
            }
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0, width, height);
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
