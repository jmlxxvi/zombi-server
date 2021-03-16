import { clients_onboarding } from "../../../../app/pepa/fraud/reports";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../../core/server/types";

const clients_on = async (_args: never, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const data = await clients_onboarding(context.request_id, false);

    return {
        error: false,
        code: 200,
        data,
    };
};

export {
    clients_on,
};
