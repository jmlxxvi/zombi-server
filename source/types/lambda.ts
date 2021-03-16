export type LambdaIncomingFromEventBridge = {
    token: string,
    type: string,
    source: string
}

export interface LambdaExtendedError extends Error {
    is_timeout: boolean
}



