import { useState, useEffect, useRef } from 'react'
import { Settings, getEmptySession, Session, Message, Config, CopilotDetail } from './types'
import * as defaults from './defaults'
import { v4 as uuidv4 } from 'uuid';
import { ThemeMode } from './theme';
import * as api from './api'
import * as remote from './remote'
import { useTranslation } from "react-i18next";
import useSWR from 'swr'
import { activateLicense, deactivateLicense, validateLicense } from './lemonsqueezy'
import { FetchError } from 'ofetch'

// setting store

export function getDefaultSettings(): Settings {
    return {
        aiProvider: 'openai',
        openaiKey: '',
        apiHost: 'https://api.openai.com',
        azureApikey: '',
        azureDeploymentName: '',
        azureEndpoint: '',
        chatglm6bUrl: '',
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        maxContextSize: "4000",
        maxTokens: "2048",
        showWordCount: false,
        showTokenCount: false,
        showModelName: false,
        theme: ThemeMode.System,
        language: 'en',
        fontSize: 13,
    }
}

export async function readSettings(): Promise<Settings> {
    const setting: Settings | undefined = await api.storage.get('settings')
    if (!setting) {
        return getDefaultSettings()
    }
    // 兼容早期版本
    const settingWithDefaults = Object.assign({}, getDefaultSettings(), setting);

    return settingWithDefaults;
}

export async function writeSettings(settings: Settings) {
    if (!settings.apiHost) {
        settings.apiHost = getDefaultSettings().apiHost
    }
    console.log('writeSettings.apiHost', settings.apiHost)
    return api.storage.set('settings', settings)
}

export async function readConfig(): Promise<Config> {
    let config: Config | undefined = await api.storage.get('configs')
    if (!config) {
        config = { uuid: uuidv4() }
        await api.storage.set('configs', config)
    }
    return config;
}

export async function writeConfig(config: Config) {
    return api.storage.set('configs', config)
}

// session store

export async function readSessions(settings: Settings): Promise<Session[]> {
    let sessions: Session[] | undefined = await api.storage.get('chat-sessions')
    if (!sessions) {
        return defaults.sessions
    }
    if (sessions.length === 0) {
        return [getEmptySession()]
    }
    return sessions.map((s: any) => {
        // 兼容旧版本的数据
        if (!s.model) {
            s.model = getDefaultSettings().model
        }
        return s
    })
}

export async function writeSessions(sessions: Session[]) {
    return api.storage.set('chat-sessions', sessions)
}

// react hook

export default function useStore() {
    const { i18n } = useTranslation();

    const [version, _setVersion] = useState('unknown')
    const [needCheckUpdate, setNeedCheckUpdate] = useState(false)
    const updateCheckTimer = useRef<NodeJS.Timeout>()
    useEffect(() => {
        const handler = async () => {
            const version = await api.getVersion()
            _setVersion(version)
            try {
                const config = await readConfig()
                const os = await api.getPlatform()
                const needUpdate = await remote.checkNeedUpdate(version, os, config)
                setNeedCheckUpdate(needUpdate)
            } catch (e) {
                console.log(e)
                setNeedCheckUpdate(true)
            }
        }
        handler()
        updateCheckTimer.current = setInterval(handler, 10 * 60 * 1000)
        return () => {
            if (updateCheckTimer.current) {
                clearInterval(updateCheckTimer.current)
                updateCheckTimer.current = undefined
            }
        }
    }, [])

    const [settings, _setSettings] = useState<Settings>(getDefaultSettings())
    const [needSetting, setNeedSetting] = useState(false)
    useEffect(() => {
        readSettings().then((settings) => {
            _setSettings(settings)
            if (settings.openaiKey === '') {
                setNeedSetting(true)
            }
            i18n.changeLanguage(settings.language).then();
        })
    }, [])
    const setSettings = (settings: Settings) => {
        _setSettings(settings)
        writeSettings(settings)
        i18n.changeLanguage(settings.language).then();
    }

    const [chatSessions, _setChatSessions] = useState<Session[]>([getEmptySession()])
    const [currentSession, switchCurrentSession] = useState<Session>(chatSessions[0])
    useEffect(() => {
        readSessions(settings).then((sessions: Session[]) => {
            _setChatSessions(sessions)
            switchCurrentSession(sessions[0])
        })
    }, [])
    const setSessions = (sessions: Session[]) => {
        _setChatSessions(sessions)
        writeSessions(sessions)
    }

    const deleteChatSession = (target: Session) => {
        const sessions = chatSessions.filter((s) => s.id !== target.id)
        if (sessions.length === 0) {
            sessions.push(getEmptySession())
        }
        if (target.id === currentSession.id) {
            switchCurrentSession(sessions[0])
        }
        setSessions(sessions)
    }
    const updateChatSession = (session: Session) => {
        const sessions = chatSessions.map((s) => {
            if (s.id === session.id) {
                return session
            }
            return s
        })
        setSessions(sessions)
        if (session.id === currentSession.id) {
            switchCurrentSession(session)
        }
    }
    const createChatSession = (session: Session, ix?: number) => {
        const sessions = [...chatSessions, session]
        setSessions(sessions)
        switchCurrentSession(session)
    }
    const createEmptyChatSession = () => {
        createChatSession(getEmptySession())
    }
    const createChatSessionWithCopilot = (copilot: CopilotDetail) => {
        const msgs: Message[] = []
        msgs.push({ id: uuidv4(), role: 'system', content: copilot.prompt })
        if (copilot.demoQuestion) {
            msgs.push({ id: uuidv4(), role: 'user', content: copilot.demoQuestion })
        }
        if (copilot.demoAnswer) {
            msgs.push({ id: uuidv4(), role: 'assistant', content: copilot.demoAnswer })
        }
        createChatSession({
            id: uuidv4(),
            name: copilot.name,
            picUrl: copilot.picUrl,
            messages: msgs,
            starred: false,
            copilotId: copilot.id,
        })
    }

    const setMessages = (session: Session, messages: Message[]) => {
        updateChatSession({
            ...session,
            messages,
        })
    }

    const [toasts, _setToasts] = useState<{ id: string, content: string }[]>([])
    const addToast = (content: string) => {
        const id = uuidv4()
        _setToasts([...toasts, { id, content }])
    }
    const removeToast = (id: string) => {
        _setToasts(toasts.filter((t) => t.id !== id))
    }

    // license activation
    const activateQuery = useSWR<{ valid: boolean }>(
        `license:${settings.premiumLicenseKey || ''}`,
        async () => {
            const licenseKey = settings.premiumLicenseKey || ''
            if (!licenseKey) {
                return { valid: false }
            }
            let instanceId = (settings.premiumLicenseInstances || {})[licenseKey]
            if (!instanceId) {
                instanceId = await activateLicense(licenseKey, await api.getInstanceName())
                setSettings({
                    ...settings,
                    premiumLicenseInstances: {
                        ...(settings.premiumLicenseInstances || {}),
                        [licenseKey]: instanceId,
                    },
                })
            }
            return validateLicense(licenseKey, instanceId)
        },
        {
            fallbackData: (settings.premiumLicenseInstances || {})[settings.premiumLicenseKey || ''] ? { valid: true } : undefined,
            revalidateOnFocus: false,
            dedupingInterval: 10 * 60 * 1000,
            onError(err) {
                if (err instanceof FetchError) {
                    if (err.status === 404) {
                        setSettings({
                            ...settings,
                            premiumLicenseKey: '',
                            premiumLicenseInstances: {},
                        })
                    }
                }
            },
        },
    )

    return {
        version,
        needCheckUpdate,

        settings,
        setSettings,
        needSetting,

        chatSessions,
        createChatSession,
        updateChatSession,
        deleteChatSession,
        createEmptyChatSession,
        createChatSessionWithCopilot,

        setSessions,
        currentSession,
        switchCurrentSession,

        toasts,
        addToast,
        removeToast,

        premiumActivated: activateQuery.data?.valid || false,
        premiumIsLoading: activateQuery.isLoading,
    }
}

export async function readCopilots(): Promise<CopilotDetail[]> {
    const copilots: CopilotDetail[] | undefined = await api.storage.get('myCopilots')
    return copilots || []
}

export async function writeCopilots(copilots: CopilotDetail[]) {
    return api.storage.set('myCopilots', copilots)
}

export function useCopilots() {
    const [copilots, _setCopilots] = useState<CopilotDetail[]>([])
    useEffect(() => {
        readCopilots().then((copilots) => {
            _setCopilots(copilots)
        })
    }, [])

    const setCopilots = (copilots: CopilotDetail[]) => {
        _setCopilots(copilots)
        writeCopilots(copilots)
    }

    const addOrUpdate = (copilot: CopilotDetail) => {
        let found = false
        const newCopilots = copilots.map((c) => {
            if (c.id === copilot.id) {
                found = true
                return copilot
            }
            return c
        })
        if (!found) {
            newCopilots.push(copilot)
        }
        setCopilots(newCopilots)
    }

    const remove = (id: string) => {
        const newCopilots = copilots.filter((c) => c.id !== id)
        setCopilots(newCopilots)
    }

    return {
        copilots,
        setCopilots,
        addOrUpdate,
        remove,
    }
}

export function useRemoteCopilots(lang: string, windowOpen: boolean) {
    const [copilots, _setCopilots] = useState<CopilotDetail[]>([])
    useEffect(() => {
        if (windowOpen) {
            remote.listCopilots(lang).then((copilots) => {
                _setCopilots(copilots)
            })
        }
    }, [lang, windowOpen])
    return { copilots }
}

export function usePremiumPrice() {
    const [price, setPrice] = useState('???')
    const [discount, setDiscount] = useState('')
    useEffect(() => {
        remote.getPremiumPrice().then((data) => {
            setPrice(`$${data.price}`)
            setDiscount(`-${data.discountLabel}`)
        })
    }, [])
    return { price, discount }
}
