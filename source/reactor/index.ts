import log from "../core/log";
import session from "../core/session"; // eslint-disable-line

import { clients_onboarding } from "../app/pepa/fraud/reports";
import { opPendingTransactionsTask } from "../app/pepa/openPass/pendingTransactions";

export const run = async (request_id: string, type: string): Promise<void> => {

    log.debug(`Executing reactor for type "${type}"`, "reactor/run", request_id);

    /* IMPORTANT NOTE: Anything running below should NOT bubble up exceptions. Please catch ALL exceptions inside the called module. */
    switch (type) {

    case "every10minutes":

        await Promise.all([
            session.expire({ request_id })
        ]);
                
        break;

    case "everyhour":
        await Promise.all([
            opPendingTransactionsTask(request_id)
        ]);
        break;
    case "every12hours":

        break;
    case "atmidnight":

        await Promise.all([
            clients_onboarding(request_id, true)
        ]);

        break;
    case "every6hours":
        
        break;
            
    default: log.error(`Invalid Reactor type specified: ${type}`, "reactor/run", request_id); break;

    }

};
