import storage from '../storage'
import { getDefaultStore } from 'jotai'
import * as atoms from '../stores/atoms'
import platform from '../platform'

// 启动时执行消息图片清理
// 只有网页版本需要清理，桌面版本存在本地、空间足够大无需清理
// 同时也避免了桌面端疑似出现的“图片丢失”问题（可能不是bug，与开发环境有关？）
if (platform.type !== 'desktop') {
    setTimeout(() => {
        tickPictureClearTask()
    }, 10 * 1000);  // 防止水合状态
}

// 假设所有图片都需要删除，然后遍历会话列表，如果会话中有图片，就从待删除列表中删除
export async function tickPictureClearTask() {
    const allBlobKeys = await storage.getBlobKeys()
    const pictureKeys = allBlobKeys.filter(key => key.startsWith('picture'))
    if (pictureKeys.length === 0) {
        return
    }
    const needDeletedSet = new Set<string>(pictureKeys)

    const store = getDefaultStore()

    // 会话中还存在的图片不需要删除
    const sessions = store.get(atoms.sessionsAtom)
    for (const session of sessions) {
        for (const msg of session.messages) {
            if (!msg.pictures) {
                continue
            }
            for (const pic of msg.pictures) {
                if (pic.storageKey) {
                    needDeletedSet.delete(pic.storageKey)
                }
            }
            if (needDeletedSet.size === 0) {
                return
            }
        }
    }

    // 用户头像不需要删除
    const settings = store.get(atoms.settingsAtom)
    if (settings.userAvatarKey) {
        needDeletedSet.delete(settings.userAvatarKey)
    }

    for (const key of needDeletedSet) {
        await storage.delBlob(key)
    }
}
