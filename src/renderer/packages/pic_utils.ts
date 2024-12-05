/**
 * 获取图片base64，在必要时缩小到主流模型支持的尺寸，同时支持将 svg、gif 等文件转成 png 格式
 * @param file 图片文件
 * @returns 图片base64
 */
export async function getImageBase64AndResize(file: File) {
    if (!file.type.startsWith('image/')) {
        throw new Error('file is not an image')
    }
    // Claude: To improve time-to-first-token, we recommend resizing images to no more than 1.15 megapixels (and within 1568 pixels in both dimensions).
    // https://docs.anthropic.com/en/docs/build-with-claude/vision
    const maxPixelL1 = 1568
    // OpenAI: For high res mode, the short side of the image should be less than 768px and the long side should be less than 2,000px.
    // https://platform.openai.com/docs/guides/vision
    const maxPixelL2 = 768
    return new Promise<string>((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            reject(new Error('cannot get canvas context'))
            return
        }
        const img = new Image()
        const objectUrl = URL.createObjectURL(file)
        img.onload = () => {
            // 释放 object URL
            URL.revokeObjectURL(objectUrl)
            // 获取原始图片尺寸
            const originalWidth = img.width
            const originalHeight = img.height
            // 计算目标尺寸,保持宽高比
            let newWidth = originalWidth
            let newHeight = originalHeight
            // 如果图片尺寸超过限制,则按比例缩小
            if (originalWidth > maxPixelL1 || originalHeight > maxPixelL1) {
                const scale = Math.min(maxPixelL1 / originalWidth, maxPixelL1 / originalHeight)
                newWidth = Math.floor(originalWidth * scale)
                newHeight = Math.floor(originalHeight * scale)
            }
            // 确保短边不超过 maxPixelL2
            const minSide = Math.min(newWidth, newHeight)
            if (minSide > maxPixelL2) {
                const scale = maxPixelL2 / minSide
                newWidth = Math.floor(newWidth * scale)
                newHeight = Math.floor(newHeight * scale)
            }
            // 设置canvas尺寸为缩放后的尺寸
            canvas.width = newWidth
            canvas.height = newHeight
            // 绘制缩放后的图片
            ctx.drawImage(img, 0, 0, newWidth, newHeight)
            // 转换为base64,jpeg使用0.9质量以减小文件大小
            const base64 = file.type === 'image/jpeg'
                ? canvas.toDataURL('image/jpeg', 0.9)
                : canvas.toDataURL('image/png', 1.0)
            resolve(base64)
        }
        img.onerror = (error) => {
            // 发生错误时也要释放 object URL
            URL.revokeObjectURL(objectUrl)
            reject(error)
        }
        img.src = objectUrl
    })
}
