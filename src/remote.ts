import { Config, CopilotDetail, SponsorAboutBanner, SponsorAd } from './types'

const releaseHost = "https://releases.chatboxai.app"

const apiHost = "https://chatboxai.app"

export async function checkNeedUpdate(version: string, os: string, config: Config): Promise<boolean> {
    const res = await fetch(`${releaseHost}/chatbox_need_update/${version}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            uuid: config.uuid,
            os: os,
        })
    })
    const json = await res.json()
    return !!json['need_update']
}

export async function getSponsorAd(): Promise<null|SponsorAd> {
    const res = await fetch(`${releaseHost}/sponsor_ad`)
    const json = await res.json()
    return json['data'] || null
}

export async function listSponsorAboutBanner(): Promise<SponsorAboutBanner[]> {
    const res = await fetch(`${releaseHost}/sponsor_about_banner`)
    const json = await res.json()
    return json['data']
}

export async function listCopilots(lang: string): Promise<CopilotDetail[]> {
    const res = await fetch(`${apiHost}/api/copilots/list`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lang })
    })
    const json = await res.json()
    return json['data']
}

export async function recordCopilotShare(detail: CopilotDetail): Promise<void> {
    await fetch(`${apiHost}/api/copilots/share-record`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            detail: detail,
        })
    })
}

export async function getPremiumPrice(): Promise<{
    price: number
    discount: number
    discountLabel: string
}> {
    const res = await fetch(`${apiHost}/api/premium/price`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    const json = await res.json()
    return json['data']
}
