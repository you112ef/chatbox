import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import * as Sentry from '@sentry/react'
import reportWebVitals from './reportWebVitals'
import * as api from './packages/runtime'
import './i18n'
import * as migration from './stores/migration'
import './static/index.css'
import './static/globals.css'

import './packages/protect' // 引入保护代码
;(async () => {
    const version = await api.getVersion().catch(() => 'unknown')
    Sentry.init({
        dsn: 'https://3cf8d15960fc432cb886d6f62e3716dc@o180365.ingest.sentry.io/4505411943464960',
        integrations: [
            new Sentry.BrowserTracing({
                // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
                tracePropagationTargets: ['localhost', /^https:\/\/chatboxai\.app/, /^https:\/\/chatboxapp\.xyz/],
            }),
            new Sentry.Replay(),
        ],
        // Performance Monitoring
        sampleRate: 0.1,
        tracesSampleRate: 0.1, // Capture 100% of the transactions, reduce in production!
        // Session Replay
        replaysSessionSampleRate: 0.05, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
        replaysOnErrorSampleRate: 0.05, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
        release: version,
    })
})()

migration.migrate()

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

// 解决移动端浏览器地址栏占用问题
// https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
function setViewportHeight() {
    let vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
}
setViewportHeight()
window.addEventListener('resize', setViewportHeight)
