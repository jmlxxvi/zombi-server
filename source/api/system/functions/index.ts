import { validate_schema } from "../../../core/utils";
import log from "../../../core/log";

import { modules_list } from "../../../app/system/logic";

import path from "path";
import fs from "fs";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../core/server/types";

const table = async (args: any, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const input_schema = {
        type: "object",
        additionalProperties: false,
        properties: {
            mod: {
                type: "string",
                minLength: 1,
                pattern: "^[a-zA-Z0-9-_/]+$"
            }
        },
        required: ["mod"]
    };

    validate_schema(input_schema, args);

    const { mod } = args;

    const module_path = path.join(__dirname, `../../../api/${mod}`);

    log.debug(`Loading module file ${module_path}`, "api/system/functions", context.request_id);

    const funs = require(module_path); // eslint-disable-line @typescript-eslint/no-var-requires

    return {
        error: false,
        code: 200,
        data: Object.keys(funs).filter(x => x.charAt(0) !== "_")
    };

};

const modules = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    return {
        error: false,
        code: 200,
        data: await modules_list()
    };

};

const function_details = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const input_schema = {
        type: "object",
        additionalProperties: false,
        properties: {
            mod: {
                type: "string",
                minLength: 1,
                pattern: "^[a-zA-Z0-9-_/]+$"
            },
            fun: {
                type: "string",
                minLength: 1,
                pattern: "^[a-zA-Z0-9-_]+$"
            }
        },
        required: ["mod", "fun"]
    };

    validate_schema(input_schema, args);

    const { mod, fun } = args;

    const base = path.resolve(__dirname + "/../../" + mod);

    let file_contents;

    if (fs.existsSync(base + ".js")) {

        file_contents = fs.readFileSync(base + ".js", "utf8");

    } else {

        file_contents = fs.readFileSync(base + "/index.js", "utf8");

    }

    const Comments = require("parse-comments"); // eslint-disable-line @typescript-eslint/no-var-requires
    const comments = new Comments();
    const data = comments.parse(file_contents).filter((x: any) => x.code.context.name === fun);

    return {
        error: false,
        code: 200,
        data: data.length > 0 ? data[0] : null
    };

};

export {
    table,
    modules,
    function_details
};
