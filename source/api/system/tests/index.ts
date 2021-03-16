import db from "../../../core/db";
import session from "../../../core/session";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../core/server/types";

// The only purpose of this module/function is to be called from API test to check if it is hidden

const _hidden = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> =>  
    ({ error: false, code: 200, message: "If you see this response there's something wrong", data: null });

/**
system/tests/ping

This function returns "pong" as data to test if the server is responding

Arguments:
    None

Example:
    None

Returns:
    <string>pong

    On error returns the error message

*/
const ping = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => 
    ({ error: false, code: 200, message: "pong", data: null });

/**
system/tests/echo

This function returns the parameters passed as is

Arguments:
    None

Example:
    None

Returns:
    The arguments without modification or processing

*/
const echo = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => 
    ({ error: false, code: 200, data: args }); 

const stress = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => { 

    // const request_id = context.request_id;

    const uuid = db.uuid();

    const token = session.token();

    await db.sql("CREATE TABLE IF NOT EXISTS stress_performance_table (a uuid constraint spt_pk primary key, b varchar(256))");

    await db.sql(
        "insert into stress_performance_table (a, b) values (:a, :b)",
        [uuid, token]
    );

    const data = await db.select({
        table: "stress_performance_table",
        where: {
            a: uuid
        }
    });

    return { error: false, code: 200, data }; 

};

export { ping, echo, _hidden, stress };
