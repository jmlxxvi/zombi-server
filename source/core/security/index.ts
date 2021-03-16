import config from "../config";
// import log from "../log";
import { timestamp, validate_schema } from "../utils";
import cache from "../cache";
import db from "../db";
import log from "../log";
import session from "../session";

// TODO move this to core/security
import { modules_list } from "../../app/system/logic";

import bcrypt from "bcryptjs";

const validate_request = (params: any) => {

    const input_schema = {
        type: "object",
        additionalProperties: false,
        properties: {
            token: {
                type: "string",
                minLength: config.security.token_size * 2,
                maxLength: config.security.token_size * 2
            },
            mod: {
                type: "string",
                minLength: 1,
                pattern: "^[a-zA-Z0-9-_/]+$"
            },
            fun: {
                type: "string",
                minLength: 1,
                pattern: "^[a-zA-Z0-9-_]+$"
            },
            args: {
                type: ["number", "string", "boolean", "array", "object", "null"]
            }
        },
        required: ["mod", "fun"]
    };

    return validate_schema(input_schema, params);

};

const validate_response = (params: any) => {

    const output_schema = {
        type: "object",
        additionalProperties: false,
        properties: {
            error: {
                type: "boolean"
            },
            message: {
                type: "string",
                minLength: 0,
                pattern: "^[a-zA-Z0-9-_/ :.,]+$"
            },
            code: {
                type: "number"
            },
            data: {
                type: ["number", "string", "boolean", "array", "object", "null"]
            }
        },
        required: ["error", "code", "data"]
    };

    return validate_schema(output_schema, params);

};

const password_hash = (password: string): Promise<string> => { return bcrypt.hash(password, config.security.salt_rounds); };

const password_compare = (password: string, hash: string): Promise<boolean> => { return bcrypt.compare(password, hash); };

const start = async (request_id: string, reload = false) => {

    const cache_exists = await cache.exists(`${config.security.cache_key}S_STARTED`);

    if (!cache_exists || reload) {

        log.debug("Loading permissions data", "security/start", request_id);

        const admins_perms = await db.sql({
            sql: `select
                    usr.id::text,
                    usr.fullname,
                    zg.group_name
                from ${db.table_prefix()}users usr
                join ${db.table_prefix()}groups_to_users zgtu on usr.id = zgtu.user_id
                join ${db.table_prefix()}groups zg on zg.id = zgtu.group_id
                where usr.enabled = 'Y' and zg.group_name = 'ADMIN'
                order by 1, 2`
        });

        const users_perms = await db.sql({
            sql: `select
                    zgtm.module_name,
                    usr.id::text,
                    usr.fullname,
                    zg.group_name
                from ${db.table_prefix()}users usr
                join ${db.table_prefix()}groups_to_users zgtu on usr.id = zgtu.user_id
                join ${db.table_prefix()}groups zg on zg.id = zgtu.group_id
                join ${db.table_prefix()}groups_to_modules zgtm on zg.id = zgtm.group_id
                where usr.enabled = 'Y'
                order by 1, 2`
        });

        const modules = await modules_list();
    
        for (const module of modules) {
    
            await cache.del(`${config.security.cache_key}:${module}`);
    
            const module_auth_users = users_perms.filter(perm => perm.module_name === module).map(perm => perm.id);
    
            if (module_auth_users.length > 0) {
    
                await cache.generic(
                    "SADD",
                    `${config.security.cache_key}:${module}`,
                    module_auth_users
                );
    
            }

            log.trace(`Permissions for module ${module}: ${JSON.stringify(module_auth_users)}`, "security/start", request_id);
            
        }

        await cache.del(`${config.security.cache_key}_ADMINS`);

        const module_auth_admins = admins_perms.map(perm => perm.id);

        if (module_auth_admins.length > 0) {
    
            await cache.generic(
                "SADD",
                `${config.security.cache_key}_ADMINS`,
                module_auth_admins
            );

        }
    
        await cache.set(`${config.security.cache_key}S_STARTED`, timestamp(true).toString());

    } else {

        log.debug("Permissions already loaded", "security/start", request_id);

    }

};

const reload_cache = async (request_id: string) => {

    return start(request_id, true);

};

const authorize = async (module: string, token: string, request_id: string) => {

    const user_id = await session.user_id(token);

    const is_admin = await cache.generic(
        "SISMEMBER",
        `${config.security.cache_key}_ADMINS`,
        user_id
    );

    log.trace(`Cache returned from ${config.security.cache_key}_ADMINS: ${is_admin}`, "security/authorize", request_id);

    if (typeof is_admin === "number" && is_admin > 0) {

        log.debug(`User with id ${user_id} is admin`, "security/authorize", request_id);

        return true;

    } else {

        const is_authorized = await cache.generic(
            "SISMEMBER",
            `${config.security.cache_key}:${module}`,
            user_id
        );

        log.trace(`Cache returned from ${config.security.cache_key}:${module}: ${is_authorized}`, "security/authorize", request_id);

        if (typeof is_authorized === "number" && is_authorized > 0) {

            log.debug(`User with id ${user_id} is authorized for ${module}`, "security/authorize", request_id);
    
            return true;
    
        } else {
    
            log.debug(`User with id ${user_id} is not authorized for ${module}`, "security/authorize", request_id);

            return false;
    
        }

    }

};

export default {
    password_hash,
    password_compare,
    validate_request,
    validate_response,
    start,
    reload_cache,
    authorize
};