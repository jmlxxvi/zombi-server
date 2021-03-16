import config from "../config";
import log from "../log";

import glob from "glob";
import fs from "fs";
import path from "path";

import redis_manager from "redis";

// Types
import { ZombiCacheLUAScrips, ZombiCacheServerInfo, RedisClientIndexed } from "./types";

let redis: RedisClientIndexed;
let connected = false;

let lua_scripts: ZombiCacheLUAScrips = {};

const script_sha = (lua_file: string) => lua_scripts[lua_file];

/**
 * Evaluates an stored SHA file
 * @param  {...any} args - The arguments for the Redis evalsha() function
 * @returns Promise{Object}
 */
const evalsha = (...args: string[]): Promise<string> => {

    if (config.cache.load_scripts) {

        if (connected) {

            if (args[0]) {

                return new Promise((resolve, reject) => {
                    redis.evalsha(...args, (err, reply) => {
                        if (err) { reject(new Error(err.message)); } else { resolve(reply); }
                    });
                });

            } else { throw new Error("Invalid eval cache SHA argument"); }

        } else { throw new Error("Calling cache function when server is not ready"); }

    } else { throw new Error("Cache scripts are disabled on configuration"); }

};

const _load_lua_script = ({ lua_file, request_id }: { lua_file: string, request_id: string }): Promise<[string, string]> => {
    return new Promise((resolve, reject) => {
        redis.script("load", fs.readFileSync(lua_file).toString(), (err, sha) => {

            const file_name: string = path.basename(lua_file);

            if (err) { reject(new Error(err.message)); }
            else {
                log.debug(`SHA for file ${file_name} is ${sha}`, "cache/_load_lua_script", request_id);

                resolve([file_name, sha]);
            }
        });
    });
};

const _load_lua_scripts = async ({ request_id }: { request_id: string }) => {

    if (config.cache.load_scripts) {

        const lua_files = glob.sync(__dirname + "/scripts/*.lua");

        type Plist = Promise<[string, string]>;

        const promises: Plist[] = [];

        lua_files.forEach(lua_file => {

            log.debug(`Loading file ${lua_file}`, "cache/_load_lua_scripts", request_id);

            promises.push(_load_lua_script({ lua_file, request_id }));

        });

        lua_scripts = (await Promise.all(promises)).reduce((obj, cur) => ({ ...obj, [cur[0]]: cur[1] }), {});

    }

};

/**
 * Connects to the Redis server defined in configuration
 * Check server/core/config
 * @param {string} request_id - The transaction request ID
 * @returns Promise{void|string} - On error returs the error message
 */
export const connect = (request_id: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (connected) {
            resolve("Already connected");
        } else {
            const pass = config.cache.pass === "none" ? "" : ":" + config.cache.pass + "@";
            const url = `${config.cache.tls ? "rediss" : "redis"}://${pass}${config.cache.host}:${config.cache.port}`;
            redis = redis_manager.createClient(url);
            redis.on("error", error => {
                connected = false;
                log.error("Redis error: " + error, "cache/connect", request_id);
                reject(error.message);
            });
            redis.on("connect", async () => {
                connected = true;
                log.info("Connected to Redis server at " + config.cache.host + ":" + config.cache.port, "cache/connect", request_id);
                await _load_lua_scripts({ request_id });
                resolve("Connected");
            });
        }
    });
};

/**
 * Executes the redis function passed as the first parameter of the array
 * The remaining array elements are passes as arguments to the Redis function
 * @param args - The generic arguments to call redis functions
 */
export const generic = (...args: any[]): Promise<any> => {
    if (connected) {
        return new Promise((resolve, reject) => {
            // TODO check if the generic argument would work with TS
            redis[args.shift()](...args, (err: Error, reply: any) => {
                if (err) { reject(new Error(err.message)); } else { resolve(reply); }
            });
        });
    } else { throw new Error("Calling cache function when server is not ready"); }
};

/**
 * Returns the keys that match with the beggining of the argument of this function
 * @param key - The (partial) key of the Redis keys namespace
 * @returns The Redis keys matching the (partial) key
 */
const keys = (key: string): Promise<string[]> => {
    if (connected) {
        return new Promise((resolve, reject) => {
            redis.keys(key + "*", (err, reply) => {
                if (err) { reject(new Error(err.message)); } else { resolve(reply); }
            });
        });
    } else { throw new Error("Calling cache function when server is not ready"); }
};

/**
 * Sets the value of a Redis key
 * @param key - The Redis key to set
 * @param value - The Redis value to set
 * @param ttl - The (optional) time to live of the entry. 0 disables the TTL
 */
const set = (key: string, value: string, ttl = 0) => {
    if (connected) {
        return new Promise((resolve, reject) => {
            if (!key || !value) { reject(new Error("Invalid values for key and/or value")); }
            else {
                if (ttl > 0) {
                    redis.set(key, value, "EX", ttl, (err, reply) => {
                        if (err) { reject(new Error(err.message)); } else { resolve(reply); }
                    });
                } else {
                    redis.set(key, value, (err, reply) => {
                        if (err) { reject(new Error(err.message)); } else { resolve(reply); }
                    });
                }

            }
        });
    } else { throw new Error("Calling cache function when server is not ready"); }
};

/**
 * Gets the value of a Redis key
 * @param {string} key - The Redis key to get
 * @return Promise{Object} of the parsed JSON value or null
 */
const get = (key: string): Promise<string|null> => {
    if (connected) {
        return new Promise((resolve, reject) => {
            redis.get(key, (err, reply) => {
                if (err) { reject(new Error(err.message)); } else { resolve(reply); }
            });
        });
    } else { throw new Error("Calling cache function when server is not ready"); }
};

/**
 * Deletes a Redis key
 * @param key - The Redis key to delete
 */
const del = (key: string) => {
    if (connected) {
        return new Promise((resolve, reject) => {
            redis.del(key, (err, reply) => {
                if (err) { reject(new Error(err.message)); } else { resolve(reply); }
            });
        });
    } else { throw new Error("Calling cache function when server is not ready"); }
};

/**
 * Checks if the given Redis key exists
 * @param key - The Redis key to delete
 * @return Promise(true) is the key exists
 */
const exists = (key: string) => {
    if (connected) {
        return new Promise((resolve, reject) => {
            redis.exists(key, (err, reply) => {
                if (err) { reject(new Error(err.message)); } else { resolve(reply > 0); }
            });
        });
    } else { throw new Error("Calling cache function when server is not ready"); }
};

/**
 * Returns information about Redis server {@link https://redis.io/commands/info}
 */
const info = () => redis.server_info as ZombiCacheServerInfo;

/**
 * Returns true if the server is connected
 */
const is_connected = () => connected;

/**
 * Disconnects from Redis
 */
const disconnect = () => { if (connected) { redis.quit(err => { connected = false; if (err) throw err; }); } };

/**
 * Executed the funtion passed as parameter and saves the results on the Redis key given
 * It is used as a caching mechanism for functions
 * @param key - The Redis key to save the results of the function
 * @param fn - The function to execute
 * @param ttl - The TTL of the created key
 * @return The cached value or the function return value
 */
const fun = async (key: string, fn: () => void, ttl = 0) => {
    if (redis) {
        const cached = await get(key);
        if (cached) {
            return cached;
        } else {
            const value: any = await fn();
            await set(key, value, ttl);
            return value;
        }
    } else { throw new Error("Calling cache function when server is not ready"); }
};

export default {
    connect,
    set,
    get,
    del,
    exists,
    generic,
    keys,
    info,
    disconnect,
    script_sha,
    evalsha,
    fun,
    is_connected
};
