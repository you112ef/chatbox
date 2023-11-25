import {
    Config,
    CopilotDetail,
    SponsorAboutBanner,
    SponsorAd,
    RemoteConfig,
    ChatboxAILicenseDetail,
} from '../../shared/types'
import { ofetch } from 'ofetch'

const RELEASE_ORIGIN = 'https://releases.chatboxai.app'
export const API_ORIGIN = 'https://chatboxai.app'

export async function checkNeedUpdate(version: string, os: string, config: Config) {
    type Response = {
        need_update?: boolean
    }
    const res = await ofetch<Response>(`${RELEASE_ORIGIN}/chatbox_need_update/${version}`, {
        method: 'POST',
        retry: 3,
        body: {
            uuid: config.uuid,
            os: os,
        },
    })
    return !!res['need_update']
}

export async function getSponsorAd(): Promise<null | SponsorAd> {
    type Response = {
        data: null | SponsorAd
    }
    const res = await ofetch<Response>(`${RELEASE_ORIGIN}/sponsor_ad`, {
        retry: 3,
    })
    return res['data'] || null
}

export async function listSponsorAboutBanner() {
    type Response = {
        data: SponsorAboutBanner[]
    }
    const res = await ofetch<Response>(`${RELEASE_ORIGIN}/sponsor_about_banner`, {
        retry: 3,
    })
    return res['data']
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
