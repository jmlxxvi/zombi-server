import { opPendingTransactionsTask } from "../../../../app/pepa/openPass/pendingTransactions/";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../../core/server/types";

const opPendingTransactionsHandler = async (_args: never, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {
    const data = await opPendingTransactionsTask(context.request_id);
    return {
        error: false,
        code: 200,
        data,
    };
};

export {
    opPendingTransactionsHandler,
};
