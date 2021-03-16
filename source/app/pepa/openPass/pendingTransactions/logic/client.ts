import log from "../../../../../core/log";
import { http } from "../../../../../core/client";

/**
 * Get Clients data via client services
 * @param id the client id
 * @param request_id the specific request_id
 *
 * @returns The client data
 */
export const getClient = async (id: string, request_id: string) => {
    try {
        const url = `${process.env.APP_MS_CLIENT_URL}internal/${id}`;
        log.info("client service url:" + url, "opPendingTransactions/logic/getClients", request_id);
        //Generate request
        const result = await http({ method: "get", url, headers: {}, data: {} });
        const { status, data } = result;
        //Check if the request is not success, launch a exception.
        if (status != 200) throw new Error(`Request to client service fail ${url}`);
        return { data };
    } catch (error) {
        log.error(
            error.message,
            "opPendingTransactions/logic/getClients",
            request_id
        );
        return error.message;
    }
};

