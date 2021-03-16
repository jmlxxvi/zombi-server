import stats from "../../../core/stats";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../core/server/types";

const data = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    // TODO check if there is no stats data on the chache

    return {
        error: false,
        code: 200,
        data: await stats.data()
    };

};

const reset = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    await stats.reset();

    return {
        error: false,
        code: 200,
        data: null
    };

};

export {
    data,
    reset
};
