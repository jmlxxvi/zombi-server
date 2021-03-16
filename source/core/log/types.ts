export type ZombiLogInput = (message: string, context: string, request_id?: string) => void;

export type ZombiLogErrorLevels = "DISABLED" | "ERROR" | "INFO" | "DEBUG" | "TRACE";