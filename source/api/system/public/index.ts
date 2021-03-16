import config from "../../../core/config";
import i18n from "../../../core/i18n";
import session from "../../../core/session";
import log from "../../../core/log";
import security from "../../../core/security";
import db from "../../../core/db";
import codes from "../../../core/codes";
import { sleep, timestamp } from "../../../core/utils";

// const firebase = require("../../../core/firebase");

import { send_mail } from "../../../app/system/logic";

import fs from "fs";
import path from "path";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../core/server/types";

/* **************************************************************************
WARNING!: This module is public as defined on config.security.public_modules
          Every exported function can be executed WITHOUT a security token.
************************************************************************** */

/**
 * This function is used as health and to check the lambda version.
 * @returns The version number
 */
const version = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    try {

        const file = path.resolve(__dirname, "../../../build_version");

        const data = fs.readFileSync(file, { encoding: "utf8", flag: "r" }); 
    
        return { 
            error: false,
            code: 200,
            data
        };
        
    } catch (error) {

        return { 
            error: true,
            code: 500,
            data: "Build version data not found"
        };
        
    }

};

/**
 * This function creates a hash of the string passed as parameter.
 * This is the same hash used to create users so it would be useful for example to create a user directly on the database.
 * @param {string} args
 * @returns It returns an string similar to $2a$10$PVCCDHQvWyi62q/OMW58Du9nAvXbdsjJ5uGVP//rH4FKCbdf7HpoG
 */
const hash = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    await sleep(2000); // To prevent password brute force attack

    return { 
        error: false,
        code: 200,
        data: await security.password_hash(args) 
    };

};

/**
 * This function is used to login to the application.
 * 
 * It is important for the client to save the token returned and use it to authenticate on subsequent requests.
 * 
 * Learn More {@tutorial login}
 * 
 * @param args 
 * @param args.username 
 * @param args.password 
 * @param args.language
 * @param args.push_notifications_token
 * 
 * @returns Login data
 * 
 * @example
 * Arguments:
 * { username: "mary", password: "PaSsw0rd", language: "es" }
 * { username: "mary", password: "PaSsw0rd", language: "es", push_notifications_token: "dssd345sdve4534twfwz" }
 * 
 * @example
 * Returned Data:
 * { "data": "token": "WEFWEF3463WEFWEF5445YWVW", { "i18n": {}, "fullname": "SYSTEM", "timezone": "America/Argentina/Buenos_Aires", "email": "none@mail.com", "country": "AR" }}
 */
const login = async (args: any, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    let { username, password, language, push_notifications_token } = args; // eslint-disable-line

    language = language ? language : config.i18n.default_language;

    if (!i18n.language_exists(language)) {

        return {
            error: true,
            code: 1005,
            message: `Invalid language: ${language}`,
            data: null
        };

    }

    const user_data = await db.selectr({
        table: "users",
        where: {
            "lower(username)": username.toLowerCase(),
            enabled: "Y"
        }
    });

    if (user_data !== null) {

        const user_id = user_data["id"];
        const email = user_data["email"];
        const hashpass = user_data["password"];
        const fullname = user_data["fullname"];
        const timezone = (user_data && user_data.timezone) ? user_data.timezone : config.i18n.default_timezone;
        const country = (user_data && user_data.country) ? user_data.country : config.i18n.default_country;

        const password_match = await security.password_compare(password, hashpass);

        if (password_match) {

            const token = session.token();

            await session.create({ token, data: { user_id, language, timezone, fullname, email, country }, push_notifications_token, request_id: context.request_id });

            return {
                error: false,
                code: 200,
                data: { fullname, email, token, timezone, i18n: i18n.get_lang_data(language) }
            };

        } else {

            log.debug(`User [${username}] cannot login`, "system/public:login", context.request_id);

            return {
                error: true,
                code: 1004,
                message: "Unable to login",
                data: null
            };

        }

    } else {

        log.debug(`User [${username}] not found`, "system/public:login", context.request_id);

        return {
            error: true,
            code: 1004,
            message: "Unable to login",
            data: null
        };

    }

};

/**
 * Logoff from the application.
 * This function destroys the session so the token can't be used anymore.
 * There are no arguments passed to this function, only the token is used.
 * 
 * @returns There is no returned data from this function
 * 
 */
const logoff = async (_args: never, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    await session.destroy({ token: context.token, request_id: context.request_id });

    return {
        error: false,
        code: 200,
        data: null
    };

};

const forgot = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const [email,] = args; // eslint-disable-line

    const user_data = await db.selectr({
        table: "users",
        where: {
            "lower(email)": email.toLowerCase(),
            enabled: "Y"
        }

    });

    if (user_data === null) {

        return {
            error: true,
            code: 1010,
            message: codes(1010),
            data: null
        };

    } else {

        const token = await session.token();

        await db.update({
            table: "users",
            values: {
                password_recovery_token: token,
                password_recovery_ts: timestamp() + (config.security.pasword_recovery_token_life * 60)
            },
            where: {
                "lower(email)": email.toLowerCase(),
                enabled: "Y"
            }
    
        });

        await send_mail("zombidevelopment@gmail.com", email, "Password Recovery", _message_template(token, config.security.notifications.email.url));

        return {
            error: false,
            code: 200,
            data: token
        };

    }

};

/**
 * Creates a tamplate to render on the password recovery email
 * @param {string} token - The session token
 * @param {string} url - The URL to follow to reset the password
 * @returns {string} - The email HTML template
 */
const _message_template = (token: string, url: string) => {
    // TODO give some dignity to this...
    return `To reset your password follow <a href="${url}?recovery=${token}">this link</a>`;
    
};

/**
 * Resets the password for a given recovery token
 * @param {string[]} args - The recovery token and the new password
 * @returns Promise{Object} 
 */
const reset = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const [token, password] = args; // eslint-disable-line

    const user_data = await db.selectr({
        table: "users",
        where: {
            password_recovery_token: token,
            enabled: "Y"
        }
    });

    if (user_data === null) {

        return {
            error: true,
            code: 1010,
            message: codes(1010),
            data: null
        };

    } else if (user_data.password_recovery_ts < timestamp()) {

        return {
            error: true,
            code: 1011,
            message: codes(1011),
            data: null
        };

    } else {

        await db.update({
            table: "users",
            values: {
                password: await security.password_hash(password)
            },
            where: {
                password_recovery_token: token
            }
        });

        return {
            error: false,
            code: 200,
            data: token
        };

    }

};

// const reset_auth_cache = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

//     await security.reload_cache();

//     return {
//         error: false,
//         code: 200,
//         data: null
//     };

// };


// const send_message_to_token = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

//     const reply = await firebase.send_message_to_token(args);

//     if (reply) {

//         return {
//             error: false,
//             code: 200,
//             data: reply ? reply : "Empty response"
//         };

//     } else {

//         return {
//             error: true,
//             code: 200,
//             message: "Firebase ID not found",
//             data: null
//         };

//     }

// };

export {
    login, 
    logoff, 
    hash, 
    forgot, 
    reset,
    version
};
