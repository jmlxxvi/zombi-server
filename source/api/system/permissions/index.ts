import session from "../../../core/session";
import db from "../../../core/db";
import { uuid, timestamp } from "../../../core/utils";
import security from "../../../core/security";

import { modules_list } from "../../../app/system/logic";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../core/server/types";

const table = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const modules = await modules_list();

    const data = [];

    for (let i = 0; i < modules.length; i++) {

        const module = modules[i];

        const permissions = await db.select({
            table: "groups_to_modules",
            where: {
                module_name: module
            }
        });

        const groups = [];

        for (const permission of permissions) {

            groups.push(await db.selectv({ table: "groups", columns: "group_name", where: permission.group_id }));

        }

        data.push({
            name: module,
            groups: groups.sort(),
            cardinality: groups.length
        });

    }

    return {
        error: false,
        code: 200,
        data: data
    };

};

const module_groups = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const module_name = args;

    const groups_in = await db.sql({
        sql: `select  
                    zg.id, 
                    zg.group_name, 
                    zgtm.module_name
                from ${db.table_prefix()}groups zg 
                join ${db.table_prefix()}groups_to_modules zgtm on zg.id = zgtm.group_id 
                where zgtm.module_name = :module_name 
                and zg.group_name <> 'ADMIN'
                order by 2`,
        bind: module_name
    });

    const groups_out = await db.sql({
        sql: `select  *
            from ${db.table_prefix()}groups zg where zg.id not in (
                select zg.id
                from ${db.table_prefix()}groups zg 
                join ${db.table_prefix()}groups_to_modules zgtm on zg.id = zgtm.group_id 
                where zgtm.module_name = :module_name
            ) and zg.group_name <> 'ADMIN'
            order by 2`,
        bind: module_name
    });

    return {
        error: false,
        code: 200,
        data: {
            in: groups_in,
            out: groups_out
        }
    };

};

const permissions_add_group = async (args: any, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const { module_name, group_id } = args;

    const data = await db.select({
        table: "groups_to_modules",
        where: {
            module_name,
            group_id
        }
    });

    if (data.length === 0) {

        const session_user_id = await session.user_id(context.token);

        await db.insert({
            table: "groups_to_modules",
            values: {
                id: uuid(),
                group_id,
                module_name,
                created_by: session_user_id,
                created_ts: timestamp()
            }
        });

    }

    await security.reload_cache(context.request_id);

    return {
        error: false,
        code: 200,
        data: null
    };


};

const permissions_remove_group = async (args: any, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const { module_name, group_id } = args;

    const data = await db.delete({
        table: "groups_to_modules",
        where: {
            module_name,
            group_id
        }
    });

    await security.reload_cache(context.request_id);

    return {
        error: false,
        code: 200,
        data
    };

};


export {
    table,
    module_groups,
    permissions_add_group,
    permissions_remove_group
};
