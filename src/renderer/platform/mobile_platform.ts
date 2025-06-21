import { App } from '@capacitor/app'
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite'
import localforage from 'localforage'
import * as defaults from 'src/shared/defaults'
import type { Config, Settings, ShortcutSetting } from 'src/shared/types'
import { v4 as uuidv4 } from 'uuid'
import { parseLocale } from '@/i18n/parser'
import { sliceTextByTokenLimit } from '@/packages/token'
import { CHATBOX_BUILD_PLATFORM } from '@/variables'
import { getBrowser, getOS } from '../packages/navigator'
import type { Platform, PlatformType } from './interfaces'
import type { KnowledgeBaseController } from './knowledge-base/interface'
import MobileExporter from './mobile_exporter'
import { parseTextFileLocally } from './web_platform_utils'

class SQLiteStorage {
  private sqlite: SQLiteConnection
  private database!: SQLiteDBConnection
  private initializePromise: Promise<void>

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite)
    this.initializePromise = this.initialize() // 初始化 Promise

    // 监听android返回键
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp()
      } else {
        window.history.back()
      }
    })
  }

  // 创建并打开数据库
  private async initialize(): Promise<void> {
    try {
      // reload的时候会报connection already open错误，所以先关闭
      this.sqlite.closeConnection('chatbox.db', false)
      this.database = await this.sqlite.createConnection('chatbox.db', false, 'no-encryption', 1, false)

      // 创建表
      const createTable = `
                CREATE TABLE IF NOT EXISTS key_value (
                    key TEXT PRIMARY KEY NOT NULL,
                    value TEXT
                );
            `
      await this.database.open()
      await this.database.execute(createTable)
    } catch (error) {
      console.error('Failed to initialize database', error)
      throw error
    }
  }

  // 确保数据库初始化完成
  private async ensureInitialized(): Promise<void> {
    await this.initializePromise
  }

  // 插入或更新数据
  async setItem(key: string, value: string): Promise<void> {
    await this.ensureInitialized()

    try {
      const query = `
          INSERT OR REPLACE INTO key_value (key, value)
          VALUES (?, ?);
        `
      await this.database.run(query, [key, value])
    } catch (error) {
      console.error('Failed to set value', error)
      throw error
    }
  }

  // 获取值
  async getItem(key: string): Promise<string | null> {
    await this.ensureInitialized()

    try {
      const query = `
          SELECT value FROM key_value
          WHERE key = ?;
        `
      const result = await this.database.query(query, [key])
      return result.values?.[0]?.value || null
    } catch (error) {
      console.error('Failed to get value', error)
      throw error
    }
  }

  // 删除值
  async removeItem(key: string): Promise<void> {
    await this.ensureInitialized()

    try {
      const query = `
          DELETE FROM key_value
          WHERE key = ?;
        `
      await this.database.run(query, [key])
    } catch (error) {
      console.error('Failed to delete value', error)
      throw error
    }
  }

  // 获取所有键值对
  async getAllItems(): Promise<{ [key: string]: any }> {
    await this.ensureInitialized()

    try {
      const query = `
            SELECT * FROM key_value;
          `
      const result = await this.database.query(query)
      // 将结果转换为 { [key: string]: value } 格式
      const keyValueObject: { [key: string]: any } = {}
      if (result.values && result.values.length > 0) {
        result.values.forEach((row) => {
          keyValueObject[row.key] = row.value
        })
      }
      return keyValueObject
    } catch (error) {
      console.error('Failed to get all values', error)
      throw error
    }
  }

  // 关闭数据库
  async closeDatabase(): Promise<void> {
    await this.ensureInitialized()

    if (this.database) {
      await this.database.close()
    }
  }
}

export default class MobilePlatform implements Platform {
  public type: PlatformType = 'mobile'

  public exporter = new MobileExporter()

  private sqliteStorage = new SQLiteStorage()

  constructor() {}

  public async getVersion(): Promise<string> {
    return (await App.getInfo()).version
  }
  public async getPlatform(): Promise<string> {
    return CHATBOX_BUILD_PLATFORM
  }
  public async getArch(): Promise<string> {
    return 'arm64'
  }
  public async shouldUseDarkColors(): Promise<boolean> {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  public onSystemThemeChange(callback: () => void): () => void {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', callback)
    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', callback)
    }
  }
  public onWindowShow(callback: () => void): () => void {
    return () => null
  }
  public onUpdateDownloaded(callback: () => void): () => void {
    return () => null
  }
  public async openLink(url: string): Promise<void> {
    window.open(url)
  }
  public async getInstanceName(): Promise<string> {
    return `${getOS()} / ${getBrowser()}`
  }
  public async getLocale() {
    const lang = window.navigator.language
    return parseLocale(lang)
  }
  public async ensureShortcutConfig(config: ShortcutSetting): Promise<void> {
    return
  }
  public async ensureProxyConfig(config: { proxy?: string }): Promise<void> {
    return
  }
  public async relaunch(): Promise<void> {
    location.reload()
  }

  public async getConfig(): Promise<Config> {
    let value = await this.getStoreValue('configs')
    if (value === undefined || value === null) {
      value = defaults.newConfigs()
      this.setStoreValue('configs', value)
    }
    return value
  }
  public async getSettings(): Promise<Settings> {
    let value = await this.getStoreValue('settings')
    if (value === undefined || value === null) {
      value = defaults.settings()
      this.setStoreValue('settings', value)
    }
    return value
  }

  public async setStoreValue(key: string, value: any) {
    await this.sqliteStorage.setItem(key, JSON.stringify(value))
  }
  public async getStoreValue(key: string) {
    const json = await this.sqliteStorage.getItem(key)
    return json ? JSON.parse(json) : null
  }
  public async delStoreValue(key: string) {
    await this.sqliteStorage.removeItem(key)
  }
  public async getAllStoreValues(): Promise<{ [key: string]: any }> {
    const items = await this.sqliteStorage.getAllItems()
    for (const key in items) {
      items[key] = items[key] && typeof items[key] === 'string' ? JSON.parse(items[key]) : items[key]
    }
    return items
  }
  public async setAllStoreValues(data: { [key: string]: any }): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.setStoreValue(key, value)
    }
  }

  public async getStoreBlob(key: string): Promise<string | null> {
    return localforage.getItem<string>(key)
  }
  public async setStoreBlob(key: string, value: string): Promise<void> {
    await localforage.setItem(key, value)
  }
  public async delStoreBlob(key: string) {
    return localforage.removeItem(key)
  }
  public async listStoreBlobKeys(): Promise<string[]> {
    return localforage.keys()
  }

  public async initTracking() {
    const GAID = 'G-B365F44W6E'
    try {
      const conf = await this.getConfig()
      window.gtag('config', GAID, {
        app_name: 'chatbox',
        user_id: conf.uuid,
        client_id: conf.uuid,
        app_version: await this.getVersion(),
        chatbox_platform_type: 'web',
        chatbox_platform: await this.getPlatform(),
        app_platform: await this.getPlatform(),
      })
    } catch (e) {
      window.gtag('config', GAID, {
        app_name: 'chatbox',
      })
      throw e
    }
  }
  public trackingEvent(name: string, params: { [key: string]: string }) {
    window.gtag('event', name, params)
  }

  public async shouldShowAboutDialogWhenStartUp(): Promise<boolean> {
    return false
  }

  public async appLog(level: string, message: string): Promise<void> {
    console.log(`APP_LOG: [${level}] ${message}`)
  }

  public async ensureAutoLaunch(enable: boolean) {
    return
  }

  async parseFileLocally(
    file: File,
    options?: { tokenLimit?: number }
  ): Promise<{ key?: string; isSupported: boolean }> {
    const result = await parseTextFileLocally(file)
    if (!result.isSupported) {
      return { isSupported: false }
    }
    if (options?.tokenLimit) {
      result.text = sliceTextByTokenLimit(result.text, options.tokenLimit)
    }
    const key = `parseFile-` + uuidv4()
    await this.setStoreBlob(key, result.text)
    return { key, isSupported: true }
  }

  public async parseUrl(url: string): Promise<{ key: string; title: string }> {
    throw new Error('Not implemented')
  }

  public async isFullscreen() {
    return true
  }

  public async setFullscreen(enabled: boolean): Promise<void> {
    return
  }

  installUpdate(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  public getKnowledgeBaseController(): KnowledgeBaseController {
    throw new Error('Method not implemented.')
  }
}
