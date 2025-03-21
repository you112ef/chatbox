import { CapacitorConfig } from '@capacitor/cli'

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
  // 以下配置是为了解决 Claude 跨域问题，但是在实际使用中并没有生效，反而导致无法正常处理 SSE 数据流（响应不流式返回）
  // plugins: {
  //     // 激活对 fetch 和 XMLHttpRequest 的原生 http 补丁
  //     // https://capacitorjs.com/docs/apis/http
  //     CapacitorHttp: {
  //         enabled: true,
  //     },
  // },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
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
  },
}

export default config
