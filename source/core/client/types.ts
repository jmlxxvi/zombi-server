export type ZombiAPIRPCData = {
    mod: string, 
    fun: string, 
    args: any, 
    token?: string
}

// TODO Use the native Axios type if possible
export interface IAxios {
    [key: string]: any;
}