import {
    Config,
    CopilotDetail,
    SponsorAboutBanner,
    SponsorAd,
    RemoteConfig,
    ChatboxAILicenseDetail,
    Settings,
} from '../../shared/types'
import { ofetch } from 'ofetch'

// ========== API ORIGIN 根据速度维护 ==========

// const RELEASE_ORIGIN = 'https://releases.chatboxai.app'

export let API_ORIGIN = 'https://chatboxai.app'
const pool = [
    'https://chatboxai.app',
    'https://api.chatboxai.app',
    'https://api.ai-chatbox.com',
]

// export let API_ORIGIN = 'http://localhost:8002'
// const pool = [
//     'http://localhost:8002'
// ]

async function testApiOrigins() {
    type Response = {
        data: {
            api_origins: string[]
        }
    }
    const fastest = await Promise.any(pool.map(async origin => {
        const res = await ofetch<Response>(`${origin}/api/api_origins`, { retry: 1 })
        return { origin, res }
    }))
    for (const newOrigin of fastest.res.data.api_origins) {
        if (! pool.includes(newOrigin)) {
            pool.push(newOrigin)
        }
    }
    API_ORIGIN = fastest.origin
}
testApiOrigins()
setInterval(testApiOrigins, 60 * 60 * 1000);

// ========== 各个接口方法 ==========

export async function checkNeedUpdate(version: string, os: string, config: Config, settings: Settings) {
    type Response = {
        need_update?: boolean
    }
    // const res = await ofetch<Response>(`${RELEASE_ORIGIN}/chatbox_need_update/${version}`, {
    const res = await ofetch<Response>(`${API_ORIGIN}/chatbox_need_update/${version}`, {
        method: 'POST',
        retry: 3,
        body: {
            uuid: config.uuid,
            os: os,
            allowReportingAndTracking: settings.allowReportingAndTracking ? 1 : 0,
        },
    })
    return !!res['need_update']
}

export async function getSponsorAd(): Promise<null | SponsorAd> {
    type Response = {
        data: null | SponsorAd
    }
    // const res = await ofetch<Response>(`${RELEASE_ORIGIN}/sponsor_ad`, {
    const res = await ofetch<Response>(`${API_ORIGIN}/sponsor_ad`, {
        retry: 3,
    })
    return res['data'] || null
}

export async function listSponsorAboutBanner() {
    type Response = {
        data: SponsorAboutBanner[]
    }
    // const res = await ofetch<Response>(`${RELEASE_ORIGIN}/sponsor_about_banner`, {
    const res = await ofetch<Response>(`${API_ORIGIN}/sponsor_ad`, {
        retry: 3,
    })
    return res['data'] || []
}

export async function listCopilots(lang: string) {
    type Response = {
        data: CopilotDetail[]
    }
    const res = await ofetch<Response>(`${API_ORIGIN}/api/copilots/list`, {
        method: 'POST',
        retry: 3,
        body: { lang },
    })
    return res['data']
}

export async function recordCopilotShare(detail: CopilotDetail) {
    await ofetch(`${API_ORIGIN}/api/copilots/share-record`, {
        method: 'POST',
        body: {
            detail: detail,
        },
    })
}

export async function getPremiumPrice() {
    type Response = {
        data: {
            price: number
            discount: number
            discountLabel: string
        }
    }
    const res = await ofetch<Response>(`${API_ORIGIN}/api/premium/price`, {
        retry: 3,
    })
    return res['data']
}

export async function getRemoteConfig(config: keyof RemoteConfig) {
    type Response = {
        data: Pick<RemoteConfig, typeof config>
    }
    const res = await ofetch<Response>(`${API_ORIGIN}/api/remote_config/${config}`, {
        retry: 3,
    })
    return res['data']
}

export interface DialogConfig {
    markdown: string
    buttons: { label: string; url: string }[]
}

export async function getDialogConfig(params: { uuid: string; language: string; version: string }) {
    type Response = {
        data: null | DialogConfig
    }
    const res = await ofetch<Response>(`${API_ORIGIN}/api/dialog_config`, {
        method: 'POST',
        retry: 3,
        body: params,
    })
    return res['data'] || null
}

export async function getLicenseDetail(params: { licenseKey: string }) {
    type Response = {
        data: ChatboxAILicenseDetail | null
    }
    const res = await ofetch<Response>(`${API_ORIGIN}/api/license/detail`, {
        retry: 3,
        headers: {
            Authorization: params.licenseKey,
        },
    })
    return res['data'] || null
}

export async function getLicenseDetailRealtime(params: { licenseKey: string }) {
    type Response = {
        data: ChatboxAILicenseDetail | null
    }
    const res = await ofetch<Response>(`${API_ORIGIN}/api/license/detail/realtime`, {
        retry: 3,
        headers: {
            Authorization: params.licenseKey,
        },
    })
    return res['data'] || null
}
