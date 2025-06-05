import { CHATBOX_BUILD_PLATFORM } from '@/variables'
import { Exporter } from './interfaces'
import { Filesystem, Directory, Encoding, WriteFileResult, WriteFileOptions } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Toast } from '@capacitor/toast'
import * as base64 from '@/packages/base64'
import i18n from '@/i18n'

export default class MobileExporter implements Exporter {
  constructor() {}

  async writeFileAutoRenameOnConflict(options: WriteFileOptions): Promise<WriteFileResult> {
    try {
      await Filesystem.stat(options)
      const ext = options.path.split('.').pop() || ''
      const baseName = options.path.split('.').slice(0, -1).join('.')
      const newFilename = `${baseName}_1${ext ? '.' + ext : ''}`
      return await this.writeFileAutoRenameOnConflict({
        ...options,
        path: newFilename,
      })
    } catch (e) {
      // 文件不存在，可以正常写入
      return await Filesystem.writeFile(options)
    }
  }

  async exportBlob(filename: string, blob: Blob, encoding?: 'utf8' | 'ascii' | 'utf16') {
    const data = await blob.text()
    // 保存
    if (CHATBOX_BUILD_PLATFORM === 'ios') {
      const result = await Filesystem.writeFile({
        path: filename,
        data: data,
        directory: Directory.Cache, // 只有 Cache 才能分享
        encoding: encoding as Encoding,
      })
      await Share.share({
        title: i18n.t('Share File') || 'Share File',
        text: i18n.t('Share File') || 'Share File',
        url: result.uri,
        dialogTitle: i18n.t('Share File') || 'Share File',
      })
    } else {
      await this.checkOrRequestPermission()
      const file = await this.writeFileAutoRenameOnConflict({
        path: 'chatbox_ai_exports/' + filename,
        data: data,
        directory: Directory.Documents,
        recursive: true,
        encoding: encoding as Encoding,
      })
      await Toast.show({ text: i18n.t('File saved to {{uri}}', { uri: file.uri }) })
    }
  }

  async exportTextFile(filename: string, content: string) {
    if (CHATBOX_BUILD_PLATFORM === 'ios') {
      const result = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache, // 只有 Cache 才能分享
        encoding: Encoding.UTF8,
      })
      await Share.share({
        title: i18n.t('Share File') || 'Share File',
        text: i18n.t('Share File') || 'Share File',
        url: result.uri,
        dialogTitle: i18n.t('Share File') || 'Share File',
      })
    } else {
      try {
        await this.checkOrRequestPermission()
        const file = await this.writeFileAutoRenameOnConflict({
          path: `chatbox_ai_exports/${filename}`,
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
          recursive: true,
        })
        await Toast.show({ text: i18n.t('File saved to {{uri}}', { uri: file.uri }) })
      } catch (e) {
        await Toast.show({
          text: i18n.t('Failed to save file: {{error}}', { error: e }),
        })
      }
    }
  }

  async exportImageFile(basename: string, base64Data: string) {
    // 解析 base64 数据
    let { type, data } = base64.parseImage(base64Data)
    if (type === '') {
      type = 'image/png'
      data = base64Data
    }
    const ext = (type.split('/')[1] || 'png').split('+')[0] // 处理 svg+xml 的情况
    const filename = basename + '.' + ext
    // 保存
    if (CHATBOX_BUILD_PLATFORM === 'ios') {
      const result = await Filesystem.writeFile({
        path: filename,
        data: data, // 不声明 encoding 时，默认就是 base64 格式
        directory: Directory.Cache, // 只有 Cache 才能分享
      })
      await Share.share({
        title: i18n.t('Share File') || 'Share File',
        text: i18n.t('Share File') || 'Share File',
        url: result.uri,
        dialogTitle: i18n.t('Share File') || 'Share File',
      })
    } else {
      await this.checkOrRequestPermission()
      const file = await this.writeFileAutoRenameOnConflict({
        path: 'chatbox_ai_exports/' + filename,
        data: data,
        directory: Directory.Documents,
        recursive: true,
      })
      await Toast.show({ text: i18n.t('File saved to {{uri}}', { uri: file.uri }) })
    }
  }

  async exportByUrl(filename: string, url: string) {
    if (CHATBOX_BUILD_PLATFORM === 'ios') {
      const file = await Filesystem.downloadFile({
        url: url,
        path: filename,
        directory: Directory.Cache,
      })
      await Share.share({
        title: i18n.t('Share File') || 'Share File',
        text: i18n.t('Share File') || 'Share File',
        url: file.path,
        dialogTitle: i18n.t('Share File') || 'Share File',
      })
    } else {
      await this.checkOrRequestPermission()
      await Filesystem.mkdir({
        path: 'chatbox_ai_exports',
        directory: Directory.Documents,
        recursive: true,
      })
      // 测试下来，Filesystem.downloadFile 似乎不会自动创建文件夹
      const file = await Filesystem.downloadFile({
        url: url,
        path: 'chatbox_ai_exports/' + filename,
        directory: Directory.Documents,
        recursive: true,
      })
      await Toast.show({ text: i18n.t('File saved to {{uri}}', { uri: file.path }) })
    }
  }

  // 请求读/写权限。在Android上需要，仅在使用 Directory.Documents 或 Directory.ExternalStorage 时需要。
  async checkOrRequestPermission() {
    let result = await Filesystem.checkPermissions()
    if (result.publicStorage === 'granted') {
      return
    }
    result = await Filesystem.requestPermissions()
    if (result.publicStorage === 'denied') {
      await Toast.show({ text: i18n.t('No permission to write file') })
    }
  }
}
