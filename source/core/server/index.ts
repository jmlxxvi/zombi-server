import config from "../config";
import log from "../log";
import session from "../session";
import { token_shortener } from "../utils";

import path from "path";
import security from "../security";
import codes from "../codes";

import { ZombiExecuteData, ZombiExecuteReturnData } from "./types";
import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

export const headers = (response: APIGatewayProxyStructuredResultV2): APIGatewayProxyStructuredResultV2 => {

    if (typeof response.headers === "undefined") { response.headers = {}; }

    response.headers["Access-Control-Allow-Headers"] = config.security.cors.headers;
    response.headers["Access-Control-Allow-Origin"] = config.security.cors.origin;
    response.headers["Access-Control-Allow-Methods"] = config.security.cors.methods;

    response.headers["Content-Type"] = "application/json";

    return response;

};

export const execute = async ({mod, fun, args, token, headers, request_id}: ZombiExecuteData): Promise<ZombiExecuteReturnData> => {

    log.debug(`Executing ${mod}:${fun} with token ${token_shortener(token)}`, "server/execute", request_id);

    if (config.security.log_arguments) {

        log.debug(`Arguments: ${args ? JSON.stringify(args) : "none"}`, "server/execute", request_id);

    }

    if (config.security.hidden_modules.includes(mod)) {

        log.trace(`Module ${mod} is hidden`, "server/execute", request_id);

        return {
            error: true,
            code: 1003,
            message: codes(1003, `${mod}:${fun}`),
            data: null
        };

    } else if (config.security.public_modules.includes(mod)) {

        log.trace(`Module ${mod} is public`, "server/execute", request_id);

        return run({mod, fun, args, token, headers, request_id});

    } else {

        if (
            config.security &&
            config.security.auth_header_key &&
            headers && 
            headers[config.security.auth_header_key] && 
            headers[config.security.auth_header_key] === config.security.auth_header_value
        ) {

            log.trace(`Using header key [${config.security.auth_header_key}] for authentication`, "server/execute", request_id);

            return run({mod, fun, args, token, headers, request_id});

        } else if (token) {

            log.debug(`Using token ${token_shortener(token)}`, "server/execute", request_id);

            if (!await session.check(token)) {

                return {
                    error: true,
                    code: 1001,
                    message: codes(1001),
                    data: null
                };

            } else if (!await security.authorize(mod, token, request_id)) {

                return {
                    error: true,
                    code: 1000,
                    message: codes(1000),
                    data: null
                };

            } else {

                await session.update({ token, request_id });

                return run({mod, fun, args, token, headers, request_id});

            }

        } else {

            log.debug("Token not sent", "server/execute", request_id);

            return {
                error: true,
                code: 1001,
                message: codes(1001),
                data: null
            };

        }

    }

};

const run = async ({mod, fun, args, token, headers, request_id}: ZombiExecuteData): Promise<ZombiExecuteReturnData> => {

    /*
		Error codes reference
		1000 Not authorized
		1001 Invalid token/Session expired
		1002 Invalid response from action function ${mod}/${fun}
		1003 Function [${fun}] is not defined on module [${mod}]
		1004 Cannot login
		1005 Invalid language
	*/

    const start_time: number = new Date().getTime();

    const module_path = path.join(__dirname, `../../api/${mod}`);

    log.debug(`Loading module file ${module_path}`, "server/run", request_id);

    const action = require(module_path); // eslint-disable-line @typescript-eslint/no-var-requires

    if (typeof action[fun] === "function" && fun.charAt(0) !== "_") {

        const results = await action[fun](args, { token, headers, request_id });

        security.validate_response(results);

        results.message = typeof results.message === "undefined" ? "ok" : results.message;

        const elapsed: number = new Date().getTime() - start_time;

        return { 
            error: results.error, 
            code: results.code, 
            message: results.message, 
            data: results.data, 
            elapsed 
        };

    } else {

        log.debug(`[${mod}:${fun}] is not defined or is hidden`, "server/run", request_id);

        return {
            error: true,
            code: 1003,
            message: codes(1003, `${mod}:${fun}`),
            data: null
        };

    }

};

module.exports = { execute, headers };
