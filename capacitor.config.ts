import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'xyz.chatboxapp.chatbox',
  appName: 'Chatbox',
  webDir: 'release/app/dist/renderer',
  server: {
    // 解决 Android 无法访问 http 服务的问题（比如连接局域网中的 Ollama 服务）
    // https://github.com/ionic-team/capacitor/discussions/4477
    cleartext: true,

    // 从 capacitor5 升级到 6 之后，androidScheme 默认为 https。这会导致历史数据无法访问（因为 domain 发生了改变），因此需要手动设置回 http。
    // https://capacitorjs.com/docs/updating/6-0#update-androidscheme
    androidScheme: 'http',
  },
  ios: {
    scheme: 'Chatbox AI',
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: true,
      iosKeychainPrefix: 'angular-sqlite-app-starter',
      iosBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for capacitor sqlite',
      },
      androidIsEncryption: true,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for capacitor sqlite',
        biometricSubTitle: 'Log in using your biometric',
      },
      electronIsEncryption: true,
      electronWindowsLocation: 'C:\\ProgramData\\CapacitorDatabases',
      electronMacLocation: '/Volumes/Development_Lacie/Development/Databases',
      electronLinuxLocation: 'Databases',
    },
    SplashScreen: {
      launchAutoHide: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'FIT_CENTER',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true,
    },
  },
}

export default config
