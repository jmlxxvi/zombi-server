let bootstrap_done = false;
const bootstrap_start_time: number = Date.now();

import config from "./core/config";
import { execute, headers as server_headers } from "./core/server";
import log from "./core/log";
import cache from "./core/cache";
import db from "./core/db";
import security from "./core/security";
import stats from "./core/stats";
import { timestamp, uuid } from "./core/utils";
//import websockets from "./core/websockets";

import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";
import { LambdaIncomingFromEventBridge, LambdaExtendedError } from "./types/lambda";
import { ZombiExecuteReturnData } from "./core/server/types";

const bootstrap_end_time = Date.now();

export const server = async (
    event: LambdaIncomingFromEventBridge | APIGatewayProxyEventV2, 
    context?: Context
): Promise<APIGatewayProxyStructuredResultV2|void> => {

    const start_time: number = timestamp(true);

    const request_id: string = uuid();

    log.info("Starting handler", "lambda/handler", request_id);

    await cache.connect(request_id);

    await db.connect(request_id);

    await security.start(request_id);

    await stats.start(request_id);

    if (bootstrap_done) {

        log.debug("Lambda already bootstrapped", "lambda/handler", request_id);

    } else {

        bootstrap_done = true;

        log.debug(`Lambda bootstrap run time: ${bootstrap_end_time - bootstrap_start_time}ms`, "lambda/handler", request_id);

    }

    log.debug(`Lambda start time: ${Date.now() - start_time}ms`, "lambda/handler", request_id);

    log.info(`Request ID: ${request_id}`, "lambda/handler", request_id);

    const reactor_event: LambdaIncomingFromEventBridge = event as LambdaIncomingFromEventBridge;

    if (reactor_event.source && reactor_event.source === "reactor") {

        // AWS Events scheduled to run periodically, https://console.aws.amazon.com/events
        // Use  { "source": "reactor", type: "every10minutes" } as event data
        // This event should NOT retry on error so make sure to set Retry attempts to zero.

        try {

            if(reactor_event.token && reactor_event.token === process.env.ZOMBI_AUTH_REACTOR_TOKEN) {

                const reactor = require("./reactor"); // eslint-disable-line @typescript-eslint/no-var-requires

                log.info("Reactor invoked via Eventbridge", "lambda/handler:reactor", request_id);

                await reactor.run(request_id, reactor_event.type);

            } else {

                log.error("Invalid token", "lambda/handler:reactor", request_id);

            }

        } catch (error) {

            log.error(error, "lambda/handler:reactor", request_id);

        }

    } else {

        const apigw_event = event as APIGatewayProxyEventV2;

        let mod = "", fun = "";

        try {

            const headers = apigw_event.headers;
            const params = JSON.parse(apigw_event.body as string);

            security.validate_request(params);

            const { args, token } = params;
            mod = params.mod;
            fun = params.fun;

            let timeout_id;
            const results = (await Promise.race([
                execute({
                    mod,
                    fun,
                    args,
                    token,
                    headers,
                    request_id
                }),
                new Promise((_, reject) => {
                    timeout_id = setTimeout(() => {
                        const e = (new Error(`Request timed out for ${mod}:${fun}`)) as LambdaExtendedError;
                        e.is_timeout = true;
                        reject(e);
                    }, config.server.timeout);
                })
            ])) as ZombiExecuteReturnData;

            clearTimeout(timeout_id);

            const elapsed = timestamp(true) - start_time;

            results.elapsed = elapsed;
            results.request_id = request_id;

            log.debug(`Server executed ${mod}:${fun} => ${results.code} in ${elapsed}ms`, "lambda/handler", request_id);

            await stats.up("exec-time", elapsed);
            await stats.up("exec-count");
            await stats.fun(mod, fun, elapsed);

            const response = server_headers({
                statusCode: 200,
                body: JSON.stringify(results)
            });

            return response;

        } catch (error) {

            log.error(error, "lambda/handler", request_id);

            const elapsed = timestamp(true) - start_time;

            await stats.up("exec-errors-time", elapsed);
            await stats.up("exec-errors-count");

            return server_headers({
                "statusCode": 500,
                "body": JSON.stringify({
                    error: true,
                    code: error.is_timeout ? 1012 : 500,
                    message: config.security.hide_server_errors ? "Server Error" : error.message,
                    data: null,
                    elapsed,
                    request_id
                })
            });

        } finally {
            
            if (context && typeof context.getRemainingTimeInMillis === "function") {

                await stats.up("exec-remaining-time", context.getRemainingTimeInMillis());

            }
            
        }

    }

};

// exports.websockets = async (event, context) => {

//     const start_time = utils.timestamp(true);

//     const request_id = utils.uuid();

//     log.start("Starting handler", "lambda/handler", request_id);

//     await cache.connect(request_id);

//     await stats.start(request_id);

//     if (bootstrap_done) {

//         log.debug("Lambda already bootstrapped", "lambda/handler", request_id);

//     } else {

//         bootstrap_done = true;

//         log.debug(`Lambda bootstrap run time: ${bootstrap_end_time - bootstrap_start_time}ms`, "lambda/handler", request_id);

//     }

//     log.debug(`Lambda start time: ${Date.now() - start_time}ms`, "lambda/handler", request_id);

//     log.info(`Request ID: ${request_id}`, "lambda/handler", request_id);

//     try {

//         const { connectionId: connection_id, domainName: domain_name, stage, routeKey: route_key } = event.requestContext;
//         const token = (event.queryStringParameters && event.queryStringParameters.token) ? event.queryStringParameters.token : null;
//         const body = event.body;

//         log.debug(`Processing Websockets route key ${route_key}`, "lambda/server:websockets", request_id);

//         await websockets.run({ token, connection_id, route_key, body, domain_name, stage, request_id });

//         return server.headers({
//             "statusCode": 200,
//             "body": "ok"
//         });

//     } catch (error) {

//         log.error(error, "lambda/server:websockets", request_id);

//         return server.headers({
//             "statusCode": 500,
//             "body": error.message
//         });

//     }

// };


/*

    } else if (Array.isArray(event.Records)) { // SNS, SQS, SES

        // aws sqs send-message --region us-east-1 --endpoint-url https://sqs.us-east-1.amazonaws.com/ --queue-url https://sqs.us-east-1.amazonaws.com/382257471380/jmg-z-q-1 --message-body "{\"what\": 1234567}"

        const items = event.Records;

        log.debug(`Processing ${items.length} queue items`, "lambda/handler:queue", request_id);

        try {

            for (const item of items) {

                log.debug(`Processing  item with type ${item.eventSource}, ID ${item.messageId}`, "lambda/handler:queue", request_id);

                log.debug(`Items body ${item.body}`, "lambda/handler:queue", request_id);

            }

        } catch (error) {

            log.error(error, "lambda/server:queue", request_id);

        }


*/


// const schema = require("./core/db/schema/postgresql");
// const commands = schema.create_schema();
// for (const sql of commands) {
//     try {
//         await db.sql({ sql });
//     } catch (error) {
//         log.error(error, "schema/create");
//         process.exit(1);
//     }
// }