export class BaseError extends Error {
    public code = 1
    constructor(message: string) {
        super(message)
    }
}

// 10000 - 19999 为通用网络接口错误

export class ApiError extends BaseError {
    public code = 10001
    constructor(message: string) {
        super('API Error: ' + message)
    }
}

export class NetworkError extends BaseError {
    public code = 10002
    public host: string
    constructor(message: string, host: string) {
        super('Network Error: ' + message)
        this.host = host
    }
}

export class AIProviderNoImplementedPaintError extends BaseError {
    public code = 10003
    constructor(aiProvider: string) {
        super(`Current AI Provider ${aiProvider} Does Not Support Painting`)
    }
}

export class AIProviderNoImplementedChatError extends BaseError {
    public code = 10005
    constructor(aiProvider: string) {
        super(`Current AI Provider ${aiProvider} Does Not Support Chat Completions API`)
    }
}

// 20000 - 29999 为 Chatbox AI 服务错误

// Chatbox AI 服务错误
// 注意，在开发时 i18nKey 中的标签和参数，都需要在 MessageErrTips 中定义
export class ChatboxAIAPIError extends BaseError {
    static codeNameMap: { [codename: string]: ChatboxAIAPIErrorDetail } = {
        // 超出配额
        'token_quota_exhausted': {
            name: 'token_quota_exhausted',
            code: 10004,    // 小于 20000 是为了兼容旧版本
            i18nKey: 'You have reached your monthly quota for the {{model}} model. Please <OpenSettingButton>go to Settings</OpenSettingButton> to switch to a different model, view your quota usage, or upgrade your plan.',
        },
        // 当前套餐不支持该模型
        'license_upgrade_required': {
            name: 'license_upgrade_required',
            code: 20001,
            i18nKey: 'Your current License (Chatbox AI Lite) does not support the {{model}} model. To use this model, please <OpenMorePlanButton>upgrade</OpenMorePlanButton> to Chatbox AI Pro or a higher-tier package. Alternatively, you can switch to a different model by <OpenSettingButton>accessing the settings</OpenSettingButton>.',
        },
        // license 过期
        'expired_license': {
            name: 'expired_license',
            code: 20002,
            i18nKey: 'Your license has expired. Please check your subscription or purchase a new one.',
        },
        // 未输入 license
        'license_key_required': {
            name: 'license_key_required',
            code: 20003,
            i18nKey: 'You have selected Chatbox AI as the model provider, but a license key has not been entered yet. Please <OpenSettingButton>click here to open Settings</OpenSettingButton> and enter your license key, or choose a different model provider.'
        },
        // 输入的 license 未找到
        'license_not_found': {
            name: 'license_not_found',
            code: 20004,
            i18nKey: 'The license key you entered is invalid. Please check your license key and try again.'
        },
        // 超出配额
        'rate_limit_exceeded': {
            name: 'rate_limit_exceeded',
            code: 20005,
            i18nKey: 'You have exceeded the rate limit for the Chatbox AI service. Please try again later.'
        },
        // 参数错误
        'bad_params': {
            name: 'bad_params',
            code: 20006,
            i18nKey: 'Invalid request parameters detected. Please try again later. Persistent failures may indicate an outdated software version. Consider upgrading to access the latest performance improvements and features.'
        },
    }
    static fromCodeName(response: string, codeName: string) {
        if (!codeName) {
            return null
        }
        if (ChatboxAIAPIError.codeNameMap[codeName]) {
            return new ChatboxAIAPIError(response, ChatboxAIAPIError.codeNameMap[codeName])
        }
        return null
    }
    static getDetail(code: number) {
        if (!code) {
            return null
        }
        for (const name in ChatboxAIAPIError.codeNameMap) {
            if (ChatboxAIAPIError.codeNameMap[name].code === code) {
                return ChatboxAIAPIError.codeNameMap[name]
            }
        }
        return null
    }

    public detail: ChatboxAIAPIErrorDetail
    constructor(message: string, detail: ChatboxAIAPIErrorDetail) {
        super(message)
        this.detail = detail
        this.code = detail.code
    }
}

interface ChatboxAIAPIErrorDetail {
    name: string
    code: number
    i18nKey: string
}
