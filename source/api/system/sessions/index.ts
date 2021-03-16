import cache from "../../../core/cache";
import session from "../../../core/session";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../core/server/types";

const table = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const keys = await cache.keys(session.cache_prefix());

    const sessions_data = [];

    for (const key of keys) {

        const [ , token ] = key.split(":");

        const session_data = await cache.generic("HGETALL", key);

        delete session_data.integrity;
        delete session_data.user_id;

        sessions_data.push({ ...session_data, token });
        
    }

    return {
        error: false,
        code: 200,
        data: sessions_data.sort((a, b) => (a.created > b.created) ? 1 : ((b.created > a.created) ? -1 : 0))
    };

};

const remove = async (args: any, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const token = args;

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
