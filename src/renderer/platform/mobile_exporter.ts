import type { WriteFileOptions, WriteFileResult } from '@capacitor/filesystem'
import { Toast } from '@capacitor/toast'
import i18n from '@/i18n'
import { CHATBOX_BUILD_PLATFORM } from '@/variables'
import { AndroidFilterWriter, type FilterWriter, IOSFilterWriter } from './filter_writer'
import type { Exporter } from './interfaces'

export default class MobileExporter implements Exporter {
  private writer: FilterWriter

  constructor() {
    this.writer = CHATBOX_BUILD_PLATFORM === 'ios' ? new IOSFilterWriter() : new AndroidFilterWriter()
  }

  async writeFileAutoRenameOnConflict(options: WriteFileOptions): Promise<WriteFileResult> {
    return await this.writer.writeFileAutoRenameOnConflict(options)
  }

  async exportBlob(filename: string, blob: Blob, encoding?: 'utf8' | 'ascii' | 'utf16') {
    await this.writer.exportBlob(filename, blob, encoding)
  }

  async exportTextFile(filename: string, content: string) {
    await this.writer.exportTextFile(filename, content)
  }

  async exportImageFile(basename: string, base64Data: string) {
    await this.writer.exportImageFile(basename, base64Data)
  }

  async exportByUrl(filename: string, url: string) {
    await this.writer.exportByUrl(filename, url)
  }

  async exportStreamingJson(filename: string, dataCallback: () => AsyncGenerator<string, void, unknown>) {
    try {
      await this.writeStreamingContent(filename, dataCallback)
    } catch (error) {
      await Toast.show({
        text: i18n.t('Failed to export file: {{error}}', { error: error }),
      })
      throw error
    }
  }

  private async writeStreamingContent(filename: string, dataCallback: () => AsyncGenerator<string, void, unknown>) {
    let tempContent = ''
    let isFirstWrite = true
    const generator = dataCallback()
    const CHUNK_SIZE = 1024 * 1024 // 1MB chunks

    for await (const chunk of generator) {
      tempContent += chunk
      // 如果内容太长，分批写入文件
      if (tempContent.length > CHUNK_SIZE) {
        if (isFirstWrite) {
          // 第一次写入创建文件
          await this.writeFirstChunk(filename, tempContent)
          isFirstWrite = false
        } else {
          // 后续写入追加内容
          await this.appendChunk(filename, tempContent)
        }
        tempContent = ''
      }
    }

    // 写入剩余内容
    if (tempContent.length > 0) {
      if (isFirstWrite) {
        // 如果所有内容都小于1MB，直接创建完整文件
        await this.writeCompleteFile(filename, tempContent)
      } else {
        // 追加最后一块内容并完成
        await this.finishWriting(filename, tempContent)
      }
    } else if (!isFirstWrite) {
      // 没有剩余内容但之前已经写入过，需要完成操作
      await this.completeExport(filename)
    }
  }

  private async writeFirstChunk(filename: string, content: string) {
    await this.writer.writeFirstChunk(filename, content)
  }

  private async appendChunk(filename: string, content: string) {
    await this.writer.appendChunk(filename, content)
  }

  private async writeCompleteFile(filename: string, content: string) {
    await this.writer.writeCompleteFile(filename, content)
  }

  private async finishWriting(filename: string, content: string) {
    await this.writer.finishWriting(filename, content)
  }

  private async completeExport(filename: string) {
    await this.writer.completeExport(filename)
  }
}
