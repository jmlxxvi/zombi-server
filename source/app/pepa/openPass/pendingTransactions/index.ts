import log from "../../../../core/log";

import { process } from "./logic/processTransactions";
/**
 * This task is the main responsible for processing pending transactions (account, cuil, cvu, alias)'s creation.
 * @param {string} request_id the request identifier
 * @returns Promise {object}
 */

export const opPendingTransactionsTask = async (request_id: string) => {
    try {
        log.info("BEGIN Process OP pending transactions...", "fraud/reports:opPendingTransactions_task", request_id);

        //Process creation pending account
        await process(request_id);

        log.info("END Process OP pending transactions...", "fraud/reports:opPendingTransactions_task", request_id);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "The process run successfully",
            }),
        };
    } catch (err) {
        return {
            statusCode: err.status || 400,
            error: err.message,
        };
    }
};

