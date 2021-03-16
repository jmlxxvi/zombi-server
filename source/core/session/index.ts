import config from "../config";
import { token_shortener, timestamp } from "../utils";
import log from "../log";
import cache from "../cache";

import i18n from "../i18n";

import crypto from "crypto";


const cache_prefix = (): string => `${config.session.cache_prefix}:`;

const check = async (token: string): Promise<boolean> => {

    const data = await cache.generic("HGETALL", cache_prefix() + token);

    if (data === null) {

        return false;

    } else if (typeof data.integrity === "undefined" || data.integrity !== _integrity_hash(token, data.updated)) {

        // TODO session forgery?, ahhhrg!! Do something useful with this information

        return false;

    } else {

        return true;
    }

};

const _integrity_hash = (token: string, timestamp: number): string => {
    return crypto
        .createHmac("sha256", config.security.hmac_secret)
        .update(token + timestamp.toString(), "binary")
        .digest("base64");
};

// TODO do not update when session does not exist
const update = async ({ token, request_id }: { token: string, request_id: string }): Promise<number> => {

    const check_exists = await cache.generic("HGET", cache_prefix() + token, "updated");

    if (check_exists === null) {

        log.error(`Updating an inexistent session entry for token ${token_shortener(token)}`, "session/create", request_id);

        return 0;

    } else {

        const ts = timestamp();
    
        await cache.generic("HSET", cache_prefix() + token, "updated", ts);

        await cache.generic("HSET", cache_prefix() + token, "integrity", _integrity_hash(token, ts));

        return ts;

    }
    
};

const create = async (
    { 
        token, 
        data, 
        request_id, 
        push_notifications_token 
    }: { 
        token: string, 
        data: any, 
        request_id: string, 
        push_notifications_token?: string
    }
): Promise<number> => {

    if (token) {

        const ts = timestamp();

        const session_data = {
            ...data, 
            created: ts,
            updated: ts
        };

        if (push_notifications_token) {
            session_data.push_notifications_token = push_notifications_token;
        }

        session_data.integrity = _integrity_hash(token, ts);

        await cache.generic("HMSET", cache_prefix() + token, session_data);

        log.debug(`Session created for token ${token_shortener(token)}`, "session/create", request_id);

        return ts;

    } else {

        log.error("Cannot create session, empty token", "session/create", request_id); 

        throw new Error("Cannot create session with an invalid token");

    }

};

const destroy = async (
    { 
        token, 
        send_sockets = true, 
        request_id 
    }: { 
        token: string, 
        send_sockets?: boolean, 
        request_id: string
    }
) => {

    const cache_key = cache_prefix() + token;

    log.trace(`Deleting cache key ${cache_key}`, "sessions/destroy", request_id);

    await cache.del(cache_key);

    if (send_sockets) {

        try {

            log.trace(`Sending expiration message to token ${token_shortener(token)}`, "sessions/destroy", request_id);

            const sockets = require("../websockets"); // eslint-disable-line @typescript-eslint/no-var-requires

            sockets.send_message_to_session({ token, context: "zombi-server-session-expired", request_id });

        } catch (error) {

            log.error(error, "sessions/destroy:send_sockets", request_id);
            
        }

    }

};

const expire = async (
    { 
        period = null, 
        send_sockets = true, 
        request_id 
    }: { 
        period?: number|null, 
        send_sockets?: boolean, 
        request_id: string 
    }
) => {

    try {

        const ts: number = timestamp();

        const limit: number = ts - (period === null ? config.session.expire : period);
    
        // log.debug(`Session limit for expiration is ${limit}, ${new Date(limit)}`, "session/expire", request_id);
    
        const keys = await cache.keys(cache_prefix());
    
        if (keys.length > 0) {
    
            log.debug(`Evaluating ${keys.length} session keys`, "session/expire", request_id);
    
            for (const key of keys) {
    
                const parts = key.split(":");
        
                const token = parts[1];
        
                const updated = await cache.generic("HGET", key, "updated");
        
                log.debug(`Session for key ${token_shortener(token)} was updated on ${i18n.format.dates.ts2date({timestamp: parseInt(updated)})}, ${ts - updated} seconds ago`, "session/expire", request_id);
        
                if (!!updated && (parseInt(updated) <= limit)) {
        
                    log.debug(`Expired session token ${token_shortener(token)} inactive since  ${i18n.format.dates.ts2date({timestamp: parseInt(updated)})}, exceeding limit of ${config.session.expire} seconds`, "session/expire", request_id);
        
                    await destroy({ token, send_sockets, request_id });
        
                }
        
            }
    
        } else {
    
            log.error("No session keys to evaluate", "session/expire", request_id);
    
        }
        
    } catch (error) {

        log.error(error, "session/expire", request_id);
        
    }

};

const get = (token: string, key: string): Promise<string|null> => {
    return cache.generic("HGET", cache_prefix() + token, key);
};

const set = (token: string, key: string, value: string) => {
    return cache.generic("HSET", cache_prefix() + token, key, value);
};

const del = (token: string, key: string) => {
    return cache.generic("HDEL", cache_prefix() + token, key);
};

const multi_set = (token: string, session_data: string[]) => {
    return cache.generic("HMSET", cache_prefix() + token, session_data);
};

const token = (): string => {
    return crypto.randomBytes(config.security.token_size).toString("hex").toUpperCase();
};

const tokens = async (user_id: string|null = null): Promise<string[]> => {

    const tokens: string[] = [];

    const keys: string[] = await cache.keys(cache_prefix() + "*");

    for (const key of keys) {
        const key_data = await cache.generic("HGETALL", key);

        if (key_data.user_id === user_id || user_id === null) {
            tokens.push(key.split(":")[1]);
        }
    }

    return tokens;
};

const user_id = async (token: string): Promise<string|null> => get(token, "user_id");

export default {
    cache_prefix,
    destroy,
    set,
    multi_set,
    get,
    del,
    check,
    token,
    create,
    expire,
    update,
    tokens,
    user_id
};
