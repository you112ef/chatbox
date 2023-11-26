export class BaseError extends Error {
    public code = 1
    constructor(message: string) {
        super(message)
    }
}

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

export class AIProviderNoImplementedPaint extends BaseError {
    public code = 10003
    constructor(aiProvider: string) {
        super(`Current AI Provider ${aiProvider} Does Not Support Painting`)
    }
}

export class QuotaExhausted extends BaseError {
    public code = 10004
    constructor() {
        super(`Sorry, you have used up your current model quota for the month. You can go to settings to view quota details or upgrade your plan.`)
    }
}
