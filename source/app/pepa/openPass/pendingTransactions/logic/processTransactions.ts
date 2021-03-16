import log from "../../../../../core/log";

//Services
import { getPendingTransactions } from "../db";
import { getClient } from "./client";
import account from "./banking/account";

/**
 * This method connect with op_pending_transactions table and obtain PENDING transactions. Then, for each client,
 * processes all the pending transactions calling to onboarding services. The lambda does not await for the result.
 * The onboarding services is responsible for processing an update op_pending_transactions table with the processed fields.
 *
 * @param {string} request_id the request identifier
 */
export const process = async (request_id: string) => {
    try {
    //Get pending transactions
        const transactions = await getPendingTransactions();
        if (!transactions) {
            log.info(
                "No pending transactions found...",
                "optransactions/logic/process",
                request_id
            );

            return;
        }

        //Process all pending transactions
        for (let i = 0; i <= transactions.length - 1; i++) {
            const trx = transactions[i];

            processTrx(trx, request_id);
            log.info("Transaction: " + JSON.stringify(trx), "opPendingTransactions/logic/process", request_id);
        }
    } catch (error) {
        log.error(error.message, "opPendingTransactions/logic/process", request_id);
        return error.message;
    }
};
/**
 * Internal method that processes pending fields for each client
 *
 * @param client_id the client identifier.
 * @param fields array with pending fields.
 * @param pending_tran_id the pending transaction identifier
 * @param request_id the request identifier
 *
 */
const processClient = async (
    client_id: string,
    fields: string[],
    pending_tran_id: string,
    request_id: string
) => {
    try{
        //Find in the db.
        const clientObj = await getClient(client_id, request_id);
        //Validate if the client exists.
        if (!(clientObj && clientObj.data))
            throw new Error("Client not found");

        const { data: client } = clientObj;
        //Process account and banking creation for a client.
        account.accountHandler(client.client_id, fields, pending_tran_id, request_id);
    }catch(error){
        log.error(error.message, "opPendingTransactions/logic/process", request_id);
        return error.message;
    }
};

const processTrx = (trx: any, request_id: string) => {
    //Destructure data
    const { client_id, fields, pending_tran_id } = trx;
    //Process account client to OP
    processClient(client_id, fields, pending_tran_id, request_id);
};

