import config from "../config";
import { timestamp } from "../utils";
import cache from "../cache";
import log from "../log";


import { ZombiStatsReturnData } from "./types";

const cache_prefix_started = `${config.stats.cache_prefix}_STARTED`;
const cache_prefix_data = `${config.stats.cache_prefix}_DATA`;

const cache_prefix_fun_count = `${config.stats.cache_prefix}_FUN_COUNT`;
const cache_prefix_fun_time = `${config.stats.cache_prefix}_FUN_TIME`;
const cache_prefix_fun_min = `${config.stats.cache_prefix}_FUN_MIN`;
const cache_prefix_fun_max = `${config.stats.cache_prefix}_FUN_MAX`;
const cache_prefix_up_min = `${config.stats.cache_prefix}_UP_MIN`;
const cache_prefix_up_max = `${config.stats.cache_prefix}_UP_MAX`;

const start = async (request_id: string): Promise<void> => {

    if (config.stats.enabled) {

        const cache_exists = await cache.exists(cache_prefix_started);

        if (!cache_exists) {

            log.trace("Starting stats", "stats/start", request_id);

            await cache.del(cache_prefix_data);
        
            await cache.set(cache_prefix_started, timestamp(true).toString());

        } else {

            log.trace("Stats already started", "stats/start", request_id);

        }

    } else { log.trace("Stats disabled on config", "stats/start", request_id); }

};

const reset = async (): Promise<unknown> => cache.del(cache_prefix_data);

const up = async (type: string, value = 1): Promise<void> => {

    if (cache.is_connected()) {

        if (config.stats.enabled) {

            await cache.generic(
                "HINCRBY", 
                cache_prefix_data, 
                type,
                value
            );
    
            await cache.evalsha("51e3092c507af738cd43a2c23b64c6f0b7fe5717", "1", `${cache_prefix_up_max}:${type}`, value.toString());
            await cache.evalsha("b91da50c42014c39186bce0dea840b7c58db21a9", "1", `${cache_prefix_up_min}:${type}`, value.toString());
    
        }

    }

};

const fun = async (mod: string, fun: string, elapsed: number): Promise<void> => {

    // TODO collapse all this on a single call to a stored procedure
    if (config.stats.enabled) {

        await cache.generic(
            "ZINCRBY", 
            cache_prefix_fun_count, 
            1,
            `${mod}:${fun}`
        );

        await cache.generic(
            "ZINCRBY", 
            cache_prefix_fun_time, 
            elapsed,
            `${mod}:${fun}`
        );

        await cache.evalsha("51e3092c507af738cd43a2c23b64c6f0b7fe5717", "1", `${cache_prefix_fun_max}:${mod}:${fun}`, elapsed.toString());
        await cache.evalsha("b91da50c42014c39186bce0dea840b7c58db21a9", "1", `${cache_prefix_fun_min}:${mod}:${fun}`, elapsed.toString());

    }

};

const data = async (): Promise<ZombiStatsReturnData> => {

    const start_timestamp = await cache.get(cache_prefix_started);

    // Services
    const data = await cache.generic(
        "HGETALL",
        cache_prefix_data
    );

    // Time, Count
    const fun_data_time = await cache.generic(
        "ZREVRANGE", 
        cache_prefix_fun_time, 
        0,
        100,
        "WITHSCORES"
    );

    const fun_data_count = await cache.generic(
        "ZREVRANGE", 
        cache_prefix_fun_count, 
        0,
        100,
        "WITHSCORES"
    );

    const fun_time = [];
    const fun_count = [];

    for (let i = 0; i < fun_data_count.length; i = i + 2) {

        fun_time.push([fun_data_time[i], parseInt(fun_data_time[i + 1])]);

        fun_count.push([fun_data_count[i], parseInt(fun_data_count[i + 1])]);

    }

    // AVG
    let fun_avg = [];

    for (const item of fun_time) {
        
        const modfun = item[0];
        const time = item[1];
        
        const count = fun_count.find(x => x[0] === modfun);

        if (count) fun_avg.push([modfun, parseInt(time.toString()) / parseInt(count[1].toString())]);

    }

    fun_avg = fun_avg.slice(0, 4).sort((a, b) => (a[1] < b[1]) ? 1 : ((b[1] < a[1]) ? -1 : 0));

    // MAX, MIN
    const fun_max: {[key: string]: any} = {};
    const fun_min: {[key: string]: any} = {};

    for (const item of fun_avg) {
        
        const modfun = item[0];

        const max = await cache.get(`${cache_prefix_fun_max}:${modfun}`);

        if (max) fun_max[modfun] = max;

        const min = await cache.get(`${cache_prefix_fun_min}:${modfun}`);

        if (min) fun_min[modfun] = min;

    }

    const exec_remaining_time_max = parseInt(await cache.get(`${cache_prefix_up_max}:exec-remaining-time`) || "0");
    const exec_remaining_time_min = parseInt(await cache.get(`${cache_prefix_up_min}:exec-remaining-time`) || "0");

    const normalized = {
        exec_count: parseInt(data["exec-count"]),
        exec_time: parseInt(data["exec-time"]),
        db_time: parseInt(data["db-time"]),
        db_count: parseInt(data["db-count"]),
        db_errors_time: parseInt(data["db-errors-time"]),
        db_errors_count: parseInt(data["db-errors-count"]),
        exec_errors_time: parseInt(data["exec-errors-time"]),
        exec_errors_count: parseInt(data["exec-errors-count"]),
        exec_remaining_time_max,
        exec_remaining_time_min
    };

    return {
        ...normalized, 
        start_timestamp: parseInt(start_timestamp!), 
        current_timestamp: timestamp(true),
        fun_time: fun_time.slice(0, 4),
        fun_count: fun_count.slice(0, 4),
        fun_avg: fun_avg.slice(0, 4).sort((a, b) => (a[1] < b[1]) ? 1 : ((b[1] < a[1]) ? -1 : 0)),
        fun_max,
        fun_min
    };

};

export default {
    start,
    reset,
    up,
    fun,
    data
};