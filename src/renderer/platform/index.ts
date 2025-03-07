import DesktopPlatform from './desktop_platform'
import { Platform } from './interfaces'
import WebPlatform from './web_platform'
import MobilePlatform from './mobile_platform'
import { CHATBOX_BUILD_TARGET } from '@/variables'

function initPlatform(): Platform {
  if (CHATBOX_BUILD_TARGET === 'mobile_app') {
    return new MobilePlatform()
  } else if (window.electronAPI) {
    return new DesktopPlatform(window.electronAPI)
  } else {
    return new WebPlatform()
  }
}

export default initPlatform()
