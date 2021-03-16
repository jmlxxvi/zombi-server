import config from "../../../core/config";
import i18n from "../../../core/i18n";
import session from "../../../core/session";
import { token_shortener } from "../../../core/utils";
import log from "../../../core/log";
import codes from "../../../core/codes";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../core/server/types";

/**
 * Starts an application for a given session token
 * If the user is already logged in to the application he does not need to send user/pass again but to "start" the application
 * That means reusing the saved token on the client to authenticate and loading the i18n data to the client
 * @return Start data
 */
const start = async (_args: never, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const user_id = await session.user_id(context.token);

    if (user_id !== null) {

        log.debug(`Starting application for token ${token_shortener(context.token)}`, "system/start", context.request_id);

        const language = await session.get(context.token, "language");
        const fullname = await session.get(context.token, "fullname");
        const timezone = await session.get(context.token, "timezone");
        const country = await session.get(context.token, "country");
        const email = await session.get(context.token, "email");
    
        return {
            error: false,
            code: 200,
            data: { i18n: i18n.get_lang_data(language ? language : config.i18n.default_language), fullname, timezone, email, country } 
        };

    } else {

        return {
            error: true,
            code: 1001,
            message: codes(1001),
            data: null
        };

    }

};

/**
 * Set the Firebase token on the user session
 * @param args - The notifications token
 * @param context 
 * @param context.token - The session token
 */
const firebase_token_set = async (args: any, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const push_notifications_token = args;

    const reply = await session.set(context.token, "push_notifications_token", push_notifications_token);

    return {
        error: false,
        code: 200,
        data: reply
    };

};


export { start, firebase_token_set };
