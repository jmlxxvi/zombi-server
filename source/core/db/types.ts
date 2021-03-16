export type ZombiDBClientsAbstraction = {
    [key: string]: any
}

export type ZombiDBReplyDataRow = {
    [key: string]: any
}

export type ZombiDBReplyDataInfo = {
    db_name: string,
    db_type: string,
    rows: number,
    identity: number
}

export type ZombiDBReplyData = {
    info: ZombiDBReplyDataInfo,
    rows: ZombiDBReplyDataRow[]
}