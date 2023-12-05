import storage from '../storage'
import { getDefaultStore } from 'jotai'
import * as atoms from '../stores/atoms'

// 启动时执行消息图片清理
tickPictureClearTask()

// 假设所有图片都需要删除，然后遍历会话列表，如果会话中有图片，就从待删除列表中删除
export async function tickPictureClearTask() {
    const allBlobKeys = await storage.getBlobKeys()
    const pictureKeys = allBlobKeys.filter(key => key.startsWith('picture'))
    if (pictureKeys.length === 0) {
        return
    }
    const needDeletedSet = new Set<string>(pictureKeys)
    const store = getDefaultStore()
    const sessions = store.get(atoms.sessionsAtom)
    for (const session of sessions) {
        if (session.type !== 'picture') {
            continue    // TODO: 如果未来普通会话也有图片，这里需要修改
        }
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
    for (const key of needDeletedSet) {
        await storage.delBlob(key)
    }
}
