export interface ZombiExecuteDataHeaders {
    [key: string]: string | undefined
}

export type ZombiExecuteData = {
    mod: string, 
    fun: string, 
    args: any, 
    token: string,
    headers: ZombiExecuteDataHeaders,
    request_id: string,
}

export type ZombiExecuteReturnData = { 
    error: boolean, 
    code: number, 
    message?: string, 
    data: any, 
    elapsed?: number,
    request_id?: string
};

export type ZombiAPIFunctionInputContext ={
    token: string, 
    headers: string[], 
    request_id: string
}