import config from "../../../../core/config";
import log from "../../../../core/log";
import db from "../../../../core/db";
import session from "../../../../core/session";
import codes from "../../../../core/codes";
import { token_shortener, validate_schema } from "../../../../core/utils";

import { verify_token as vt } from "../../../../app/pepa/security/idp/tokens";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../../core/server/types";

/* **************************************************************************
WARNING!: This module is public as defined on config.security.public_modules
          Every exported function can be executed WITHOUT a security token.
************************************************************************** */

/**
 * Verifies a JWT token obtained from the IDP and creates a session
 * @param args The JWT token to verify
 * @param context The API context
 * @returns The session created data
 */
const verify_token = async (args: string, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    if (validate_schema({ type: "string" }, args, false)) {

        try {
    
            const token_data = await vt(args, context.request_id);
    
            if (token_data.verified) {
    
                const username = token_data.name;
                const email = token_data.email;
        
                const user_data = await db.selectr({
                    table: "fintech_clients",
                    where: {
                        "lower(email)": email.toLowerCase()
                    }
                });
    
                if (user_data !== null) {
            
                    const user_id = user_data["client_id"];
                    const fullname = JSON.parse(user_data["google"]).name;
                    const timezone = (user_data && user_data.timezone) ? user_data.timezone : config.i18n.default_timezone;
                    const country = (user_data && user_data.country) ? user_data.country : config.i18n.default_country;
                    const language = config.i18n.default_language;
            
                    const token = session.token();
    
                    log.debug(`Created new session token ${token_shortener(token)}`, "pepa/security/public", context.request_id);
            
                    await session.create({
                        token, 
                        data: { 
                            user_id, 
                            language, 
                            timezone, 
                            fullname, 
                            email, 
                            country 
                        }, 
                        request_id: context.request_id 
                    });
        
                    return {
                        error: false,
                        code: 200,
                        data: { fullname, email, token, timezone }
                    };
            
                } else {
            
                    log.debug(`User ${username} not found`, "pepa/security/public", context.request_id);
            
                    return {
                        error: true,
                        code: 1004,
                        message: "Unable to login",
                        data: null
                    };
            
                }
    
            } else {
    
                return {
                    error: true,
                    code: 1001,
                    data: null,
                    message: "Token verification failed"
                };
    
            }
    
        } catch (error) {
    
            log.error(error, "pepa/security/public", context.request_id);
    
            return {
                error: true,
                code: 1001,
                data: null,
                message: error.message
            };
            
        }

    } else {

        return {
            error: true,
            code: 1013,
            message: codes(1013),
            data: null
        };

    }

};

export {
    verify_token
};