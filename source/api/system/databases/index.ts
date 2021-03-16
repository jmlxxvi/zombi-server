import config from "../../../core/config";
import db from "../../../core/db";
import session from "../../../core/session";
import cache from "../../../core/cache";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../core/server/types";

const table = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const databases = Object.keys(config.db);

    const dbs = [];

    for (const db_name of databases) {

        if (config.db[db_name].enabled === true) {

            const version = await db.version(db_name);

            dbs.push({
                user: config.db[db_name].user,
                host: config.db[db_name].host,
                port: config.db[db_name].port,
                name: config.db[db_name].name,
                type: config.db[db_name].type,
                enabled: config.db[db_name].enabled,
                db_name,
                version
            });

        }

    }

    const cache_info = await cache.info();

    const ehcac = {
        host: config.cache.host,
        port: config.cache.port,
        tls: config.cache.tls,
        version: `${cache_info.redis_version} ${cache_info.os}`,
        used_memory: cache_info.used_memory_human,
        max_memory: cache_info.maxmemory_human
    };

    return {
        error: false,
        code: 200,
        data: { dbs, cache: ehcac }
    };

};

const remove = async (args: any, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const token = args as string;

    session.destroy({ token, request_id: context.request_id });

    return {
        error: false,
        code: 200,
        data: null
    };

};

export {
    table,
    remove
};
