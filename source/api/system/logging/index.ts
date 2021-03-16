import config from "../../../core/config";
import cache from "../../../core/cache";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../core/server/types";

const table = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const only_errors = args;

    let reply = await cache.generic("LRANGE", config.log.persist.cache_key, 0, -1);

    if (only_errors) {

        reply = reply.filter((x: any) => x.split("|")[1] === "ERROR");

    }

    return {
        error: false,
        code: 200,
        data: reply.reverse()
    };

};

export {
    table
};
