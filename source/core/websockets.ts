import config from "./config";
import log from "./log";
import cache from "./cache";
import session from "./session";
import { token_shortener } from "./utils";

import aws from "./aws";

const cache_prefix = () => `${config.cache.cache_prefix}:`; 

const _connect = async (
    { token, connection_id, domain_name, stage, request_id }:
    { token: string, connection_id: string, domain_name: string, stage: string, request_id: string }
) => {

    log.debug(`Connecting from token: ${token_shortener(token)}, connection ID: ${connection_id}`, "websockets/_connect", request_id);

    const cache_data = {
        "token": token,
        "domain_name": domain_name,
        "stage": stage
    };

    await session.set(token, "connection_id", connection_id);

    await cache.generic("HMSET", cache_prefix() + connection_id, cache_data);

};

const _disconnect = async ({ connection_id, request_id }: { connection_id: string, request_id: string }) => {

    const token = await cache.generic("HGET", cache_prefix() + connection_id, "token");

    log.debug(`Disconnecting from token: ${token_shortener(token)}, connection ID: ${connection_id}`, "websockets/_disconnect", request_id);

    await session.del(token, "connection_id");

    await cache.del(cache_prefix() + connection_id);

};

const _default = async ({ connection_id, body, request_id }: { connection_id: string, body: string, request_id: string }) => {

    const { token, domain_name, stage } = await cache.generic("HGETALL", cache_prefix() + connection_id);

    log.debug(`Default action for token: ${token_shortener(token)}, connection ID: ${connection_id}`, "websockets/_default", request_id);

    await aws.send_ws_message({ domain_name, stage, connection_id, message: `You sent ${body}` });

};

const run = async (
    { token, connection_id, route_key, body, domain_name, stage, request_id }: 
    { token: string, connection_id: string, route_key: string, body: string, domain_name: string, stage: string, request_id: string }
): Promise<void> => {

    if (route_key === "$connect") {

        await _connect({ token, connection_id, domain_name, stage, request_id });

    } else if (route_key === "$disconnect") {

        await _disconnect({ connection_id, request_id });

    } else {

        await _default({ connection_id, body, request_id });

    }

};

const send_message_to_session = async (
    { token, context = "none", data = [], request_id }: 
    { token: string, context: string, data: any, request_id: string}
): Promise<void> => {

    const connection_id = await session.get(token, "connection_id");

    if (connection_id) {

        const connection_data = await cache.generic("HGETALL", cache_prefix() + connection_id);

        if (connection_data) {

            const { domain_name, stage } = connection_data;

            const short_token = token_shortener(token);
        
            log.debug(`Sending message to token: ${short_token}, connection ID: ${connection_id}, domain: ${domain_name}, stage: ${stage}`, "sockets/send_message_to_session", request_id);
        
            await aws.send_ws_message({ domain_name, stage, connection_id, message: JSON.stringify({ context, data }) });

        } else {

            log.debug(`Connection data not found for connection ID: ${connection_id}`, "sockets/send_message_to_session", request_id);

        }

    } else {

        log.debug(`Connection ID not found for token: ${token}`, "sockets/send_message_to_session", request_id);

    }

};

const send_message_to_user = async (
    { user_id, context = "none", data = [], request_id }: 
    { user_id?: string, context: string, data: any, request_id: string}
): Promise<void> => {

    const tokens = await session.tokens(user_id);

    for (const token of tokens) {

        const user_name = await session.get(token, "fullname");

        log.debug(`Sending message to ${user_name}, token: ${token_shortener(token)}`, "sockets/send_message_to_user", request_id);

        send_message_to_session({ token, context, data, request_id });

    }

};

const send_broadcast_message = async (
    { context = "none", data = [], request_id }: 
    { context: string, data: any, request_id: string}
): Promise<void> => {

    await send_message_to_user({ context, data, request_id });

};

export {
    run,
    send_broadcast_message,
    send_message_to_user,
    send_message_to_session
};

// Notes:
//  In case of error
// "errorType": "AccessDeniedException",
// "errorMessage": "User: arn:aws:sts::382257471380:assumed-role/JMG-TEST-WS-PUBLIC-role-gtexeo7z/JMG-TEST-WS-PUBLIC is not authorized to perform: execute-api:ManageConnections on resource: arn:aws:execute-api:us-east-1:********1380:ihd9y8pe0l/dev/POST/@connections/{connectionId}",
//  It is possible to "solve" it by adding the policy AmazonAPIGatewayInvokeFullAccess to the lambda role