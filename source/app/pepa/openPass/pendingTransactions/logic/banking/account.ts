import log from "../../../../../../core/log";

import { http } from "../../../../../../core/client";

const accountHandler = async(client_id: string, fields: string[], pending_tran_id: string, request_id: string) => {
    try {

        let url = `${process.env.APP_MS_ON_BOARDING_URL}health`;

        const result = await http({ method: "get", url, headers: {}, data: {} });
        log.info("Health" + JSON.stringify(result.data), "opPendingTransactions/logic/accountHandler", request_id);

        url = `${process.env.APP_MS_ON_BOARDING_URL}banking/pending/${client_id}`;
        log.info("onboarding url: " + url, "opPendingTransactions/logic/accountHandler", request_id);

        http({
            url,
            data: { fields, pending_tran_id },
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        log.error(
            error.message,
            "opPendingTransactions/accountHandler",
            request_id
        );
        return error.message;
    }
};

export default {
    accountHandler,
};
