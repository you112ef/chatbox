import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
    appId: 'xyz.chatboxapp.chatbox',
    appName: 'Chatbox',
    webDir: 'release/app/dist/renderer',
    server: {
        androidScheme: 'https',
    },
    ios: {
        scheme: 'Chatbox AI',
    },
    plugins: {
        // 激活对 fetch 和 XMLHttpRequest 的原生 http 补丁
        // 理论上可以解决接口跨域、使用系统原生代理的能力
        // https://capacitorjs.com/docs/apis/http
        CapacitorHttp: {
            enabled: true,
        },
    },
}

export default config
