import { handle_metrics_events } from "../../../app/pepa/metrics/logic";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../core/server/types";

export const handle_metrics = async (args: any, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {
    
    const data = await handle_metrics_events(args, context.request_id);

    return {
        error: false,
        code: 200,
        data
    };

};
