import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import Locale from './locales'
import { dialog } from 'electron'
import { getSettings } from './store-node'

export class AppUpdater {
  constructor() {
    log.transports.file.level = 'info'
    const locale = new Locale()

    autoUpdater.logger = log
    autoUpdater.once('update-downloaded', (event) => {
      dialog
        .showMessageBox({
          type: 'info',
          buttons: [locale.t('Restart'), locale.t('Later')],
          title: locale.t('App_Update'),
          message: event.releaseName || locale.t('New_Version'),
          detail: locale.t('New_Version_Downloaded'),
        })
        .then((returnValue) => {
          if (returnValue.response === 0) autoUpdater.quitAndInstall()
        })
    })
    const settings = getSettings()
    if (settings.autoUpdate) {
      this.tryUpdate()
    }
  }

  async tryUpdate() {
    const feedUrls = [
      'https://chatboxai.app/api/auto_upgrade',
      'https://api.chatboxai.app/api/auto_upgrade',
      'https://api.ai-chatbox.com/api/auto_upgrade',
      'https://api.chatboxapp.xyz/api/auto_upgrade',
      'https://api.chatboxai.com/api/auto_upgrade',
    ]
    for (const url of feedUrls) {
      try {
        autoUpdater.setFeedURL(url)
        const settings = getSettings()

        if (settings.betaUpdate) {
          autoUpdater.channel = 'beta'
        }
        const result = await autoUpdater.checkForUpdatesAndNotify()
        if (result) {
          return result
        }
      } catch (e) {
        log.error(`auto_updater: attempt failed: ${url}. `, e)
      }
    }
    return null
  }
}
