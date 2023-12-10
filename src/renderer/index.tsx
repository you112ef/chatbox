import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import reportWebVitals from './reportWebVitals'
import './i18n'
import * as migration from './stores/migration'
import './static/index.css'
import './static/globals.css'
import { CHATBOX_BUILD_TARGET, CHATBOX_BUILD_PLATFORM } from './variables'

// ==========执行初始化==============

// 按需加载 polyfill
import './setup/load_polyfill'

// Sentry 初始化
import './setup/sentry_init'

// 引入保护代码
import './setup/protect'

// 引入移动端安全区域代码，主要为了解决异形屏幕的问题
if (CHATBOX_BUILD_TARGET === 'mobile_app' && CHATBOX_BUILD_PLATFORM === 'ios') {
    import('./setup/mobile_safe_area')
}

// 解决移动端浏览器地址栏占用问题
import './setup/mobile_browser_viewport_height'

// 数据迁移
migration.migrate()

// 最后执行图片清理
import './setup/picture_clear'

// ==========渲染节点==============

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
