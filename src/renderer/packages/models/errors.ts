export class ApiError extends Error {
    public code = 10001
    constructor(message: string) {
        super('API Error: ' + message)
    }
}

export class NetworkError extends Error {
    public code = 10002
    public host: string
    constructor(message: string, host: string) {
        super('Network Error: ' + message)
        this.host = host
    }
}

export class AIProviderNoImplementedPaint extends Error {
    public code = 10003
    constructor(aiProvider: string) {
        super(`Current AI Provider ${aiProvider} Does Not Support Painting`)
    }
}
