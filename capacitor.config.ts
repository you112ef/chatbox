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
    // 以下配置是为了解决 Claude 跨域问题，但是在实际使用中并没有生效，反而导致无法正常处理 SSE 数据流（响应不流式返回）
    // plugins: {
    //     // 激活对 fetch 和 XMLHttpRequest 的原生 http 补丁
    //     // https://capacitorjs.com/docs/apis/http
    //     CapacitorHttp: {
    //         enabled: true,
    //     },
    // },
}

export default config
