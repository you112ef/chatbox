export function exportTextFile(filename: string, content: string) {
    var eleLink = document.createElement('a')
    eleLink.download = filename
    eleLink.style.display = 'none'
    var blob = new Blob([content])
    eleLink.href = URL.createObjectURL(blob)
    document.body.appendChild(eleLink)
    eleLink.click()
    document.body.removeChild(eleLink)
}

export function exportPngFile(filename: string, base64: string) {
    const raw = window.atob(base64)
    const rawLength = raw.length
    const uInt8Array = new Uint8Array(rawLength)
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i)
    }
    const blob = new Blob([uInt8Array])
    var eleLink = document.createElement('a')
    eleLink.download = filename
    eleLink.style.display = 'none'
    eleLink.href = URL.createObjectURL(blob)
    document.body.appendChild(eleLink)
    eleLink.click()
    document.body.removeChild(eleLink)
}

export function exportByUrl(filename: string, url: string) {
    var eleLink = document.createElement('a')
    eleLink.style.display = 'none'
    eleLink.download = filename
    eleLink.href = url
    document.body.appendChild(eleLink)
    eleLink.click()
    document.body.removeChild(eleLink)
}
