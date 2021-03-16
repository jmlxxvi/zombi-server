import config from "../config";
import { timestamp } from "../utils";
import cache from "../cache";

import chalk from "chalk";

import { ZombiLogInput, ZombiLogErrorLevels } from "./types";

const error_levels: Record<ZombiLogErrorLevels, number> = {
    "DISABLED": 0,
    "ERROR": 1,
    "INFO": 2,
    "DEBUG": 3,
    "TRACE": 4
};

let last_ts: number = timestamp(true);

const _log = async (message: string|Error, context = "UNKNOWN", level: number, request_id?: string): Promise<void> => {

    if (level === -1 || error_levels[config.log.level] >= level) {

        const rid: string = request_id ? request_id : "none";

        const current_ts: number = timestamp(true);
        const delta_ts: number = current_ts - last_ts;

        last_ts = current_ts;

        let msg: string;

        if (message instanceof Error || (typeof message === "object" && "stack" in message)) {

            msg = message.stack ? message.stack.toString() : "Missing stack data";

        } else if (typeof message === "string") {

            msg = message;

        } else { msg = "Incorrect message type for logging"; }

        let badge;

        switch (level) {
        case 1: badge = chalk.red("ERROR "); break;
        case 2: badge = chalk.blue("INFO  "); break;
        case 3: badge = chalk.cyan("DEBUG "); break;
        case 4: badge = chalk.magenta("TRACE "); break;
        default: badge = chalk.blue("NONE  "); break;
        }

        console.log(`${badge} [${rid}] [${context}] ${msg.replace(/(?:\r\n|\r|\n)/g, "")} [${delta_ts.toString()}]`);

        if (cache.is_connected() && config.log.persist.enabled === true) {

            try {

                let error_type;

                switch (level) {
                case 1: error_type = "ERROR"; break;
                case 2: error_type = "INFO"; break;
                case 3: error_type = "DEBUG"; break;
                case 4: error_type = "TRACE"; break;
                default: error_type = "NONE"; break;
                }

                await cache.generic(
                    "RPUSH", 
                    config.log.persist.cache_key, 
                    `${timestamp.toString()}|${error_type}|[${context}] ${msg}|${delta_ts.toString()}|${rid}`
                );

                // TODO put this on reactor so it does not execute on every log call
                await cache.generic(
                    "LTRIM", 
                    config.log.persist.cache_key, 
                    config.log.persist.max_items * -1,
                    -1
                );
                
            } catch (error) {

                console.log(`${chalk.red("ERROR ")} [log/persistence] ${error.message}`);
                
            }

        }

    }

};

const always: ZombiLogInput = (message, context, request_id) => { _log(message, context, -1, request_id); };
const error: ZombiLogInput = (message, context, request_id) => { _log(message, context, 1, request_id); };
const info: ZombiLogInput = (message, context, request_id) => { _log(message, context, 2, request_id); };
const debug: ZombiLogInput = (message, context, request_id) => { _log(message, context, 3, request_id); };
const trace: ZombiLogInput = (message, context, request_id) => { _log(message, context, 4, request_id); };

export default {
    always,
    error,
    info,
    debug,
    trace
};

