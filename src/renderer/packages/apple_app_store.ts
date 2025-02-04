import * as Sentry from '@sentry/react'
import { getDefaultStore } from 'jotai'
import * as atoms from '../stores/atoms'
import { store as keypairStore } from './keypairs'
import platform from '../platform'
import { CHATBOX_BUILD_PLATFORM } from '../variables'

// 本次启动是否已经引导过用户评价 App Store
let hasOpenAppStoreReviewPage = false

export async function tryOpenAppStoreReviewPage() {
    try {
        if (hasOpenAppStoreReviewPage) {
            return
        }
        if (await keypairStore.getItem<boolean>('appStoreRatingClicked')) {
            return
        }
        const lastAppStoreReviewTime = await keypairStore.getItem<number>('lastAppStoreReviewTime') || 0
        const now = Date.now()
        if (now - lastAppStoreReviewTime < 1000 * 60 * 60 * 24 * 30) { // 30 天
            return
        }
        hasOpenAppStoreReviewPage = true
        await keypairStore.setItem('lastAppStoreReviewTime', now)
        const store = getDefaultStore()
        store.set(atoms.openAppStoreRatingDialogAtom, true)
    } catch (e) {
        console.error(e)
        Sentry.captureException(e)
    }
}

// 记录App Store评分弹窗点击
export async function recordAppStoreRatingClick() {
    await keypairStore.setItem('appStoreRatingClicked', true)
}

let tickCount = 0
export function tickAfterMessageGenerated() {
    if (CHATBOX_BUILD_PLATFORM !== 'ios') {
        return
    }
    tickCount++
    if (tickCount % 4 === 0) {
        tryOpenAppStoreReviewPage()
    }
}
