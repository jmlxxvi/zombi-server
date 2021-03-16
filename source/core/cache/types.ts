import { ServerInfo, RedisClient } from "redis";

export interface ZombiCacheLUAScrips {
    [key: string]: string
}

// It seems this type is incomplete on redis definition
// See @types/redis
export interface ZombiCacheServerInfo extends ServerInfo {
    os: string,
    used_memory_human: string,
    maxmemory_human: string
}

export interface RedisClientIndexed extends RedisClient {
    [key: string]: any
}