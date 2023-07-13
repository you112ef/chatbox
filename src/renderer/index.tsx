import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import * as Sentry from '@sentry/react'
import reportWebVitals from './reportWebVitals'
import * as api from './api'
import './i18n.js'
import * as migration from './stores/migration'

import './styles/index.css'
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
        tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
        // Session Replay
        replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
        replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
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
