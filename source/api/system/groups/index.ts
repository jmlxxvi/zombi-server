import codes from "../../../core/codes";
import session from "../../../core/session";
import db from "../../../core/db";
import { uuid, timestamp } from "../../../core/utils";
import security from "../../../core/security";

import { sql as tsql } from "../../../app/shared/tables";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../core/server/types";

const table = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const { page, size, order, search, dir } = args;

    const sql = `select
                    grp.id,
                    grp.group_name,
                    grp.description,
                    us2.fullname as "created_by",
                    grp.created_ts,
                    (select count(*) from ${db.table_prefix()}groups_to_users gtu where gtu.group_id = grp.id) as "cardinality" 
                from ${db.table_prefix()}groups grp
                join ${db.table_prefix()}users us2 on (grp.created_by = us2.id)
                where 1=1
				and (
					lower(grp.group_name) like concat('%', concat(lower(:search), '%')) or
                    lower(grp.description) like concat('%', concat(lower(:search), '%'))
                )`;

    const data = await tsql({ sql, page, size, order, dir, search });

    return {
        error: false,
        code: 200,
        data
    };

};

const group_by_id = async (args: any, __context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const id = args;

    const data = await db.select({
        table: "groups",
        columns: ["id", "group_name", "description"],
        where: id
    });

    return {
        error: false,
        code: 200,
        data: data[0]
    };

};

const edit_save = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const {
        id,
        group_name,
        description
    } = args;

    const data = await db.update({
        table: "groups",
        values: {
            group_name,
            description
        },
        where: id
    });

    return {
        error: false,
        code: 200,
        data
    };

};

const edit_delete = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const id = args;

    const group_name = await db.selectv({ table: "groups", columns: "group_name", where: id });

    if (group_name && group_name.toLowerCase() === "admin") {

        return {
            error: true,
            code: 1008,
            message: codes(1008),
            data: null
        };

    } else {

        const data = await db.delete({
            table: "groups",
            where: id
        });
    
        return {
            error: false,
            code: 200,
            data
        };
    
    }

};

const create_save = async (args: any, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const user_id = await session.user_id(context.token);

    const {
        group_name,
        description
    } = args;

    const data = await db.insert({
        table: "groups",
        values: {
            id: uuid(),
            group_name,
            description,
            created_by: user_id,
            created_ts: timestamp()
        }
    });

    return {
        error: false,
        code: 200,
        data
    };

};

const group_users = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const group_id = args;

    const users_in = await db.sql({
        sql: `select id::text, fullname from ${db.table_prefix()}users where id in (select user_id from ${db.table_prefix()}groups_to_users where group_id = :group_id) order by 2`,
        bind: group_id
    });

    const users_out = await db.sql({
        sql: `select id::text, fullname from ${db.table_prefix()}users where id not in (select user_id from ${db.table_prefix()}groups_to_users where group_id = :group_id) order by 2`,
        bind: group_id
    });

    return {
        error: false,
        code: 200,
        data: {
            in: users_in,
            out: users_out
        }
    };

};

const group_delete_user = async (args: any, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const { group_id, user_id } = args;

    await db.delete({
        table: "groups_to_users",
        where: {
            user_id,
            group_id
        }
    });

    await security.reload_cache(context.request_id);

    return {
        error: false,
        code: 200,
        data: null
    };

};

const group_add_user = async (args: any, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const { group_id, user_id } = args;

    const data = await db.select({
        table: "groups_to_users",
        where: {
            user_id,
            group_id
        }
    });

    if (data.length === 0) {

        const session_user_id = await session.user_id(context.token);

        await db.insert({
            table: "groups_to_users",
            values: {
                id: uuid(),
                group_id,
                user_id,
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

export {
    table,
    group_by_id,
    edit_save,
    edit_delete,
    create_save,
    group_users,
    group_delete_user,
    group_add_user
};
