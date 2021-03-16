import codes from "../../../core/codes";
import i18n_countries from "../../../core/i18n/countries.json";
import i18n_languages from "../../../core/i18n/languages.json";
import i18n_zones from "../../../core/i18n/zones.json";
import session from "../../../core/session";
import db from "../../../core/db";
import { timestamp } from "../../../core/utils";

import { sql as tsql } from "../../../app/shared/tables";
import security from "../../../core/security";

import { ZombiExecuteReturnData, ZombiAPIFunctionInputContext } from "../../../core/server/types";

const table = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const { page, size, order, search, dir } = args;

    // const sql = `select
    //                 usr.id,
    //                 usr.username,
    //                 usr.fullname,
    //                 usr.email,
    //                 usr.timezone,
    //                 usr.country,
    //                 usr.language,
    //                 usr.enabled,
    //                 us2.fullname as "created_by",
    //                 usr.created_ts,
    //                 usr.enabled
    //             from ${db.table_prefix()}users usr
    //             join ${db.table_prefix()}users us2 on (usr.created_by = us2.id)
    //             where 1=1
    // 			and (
    // 				lower(usr.username) like concat('%', concat(lower(:search), '%')) or
    // 				lower(usr.fullname) like concat('%', concat(lower(:search), '%')) or
    // 				lower(usr.email) like concat('%', concat(lower(:search), '%'))
    //             )`;
                
    const sql = await db.file("system/users_table.sql");

    const data = await tsql({ sql, page, size, order, dir, search });

    for (const row of data.rows) {

        const data_country = row.country;
        const country_data = i18n_countries.find(country => country[0] === data_country);
        if (country_data) { row.country = country_data[1]; }

        const data_language = row.language;
        const language_data = i18n_languages.find(language => language[2] === data_language);
        if (language_data) { row.language = language_data[1]; }
    
    }

    return {
        error: false,
        code: 200,
        data
    };

};

const user_by_id = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const id = args;

    const data = await db.select({
        table: "users",
        columns: ["id", "username", "fullname", "email", "timezone", "country", "language", "enabled"],
        where: id
    });

    for (const row of data) {

        const data_country = row.country;
        const country_data = i18n_countries.find(country => country[0] === data_country);
        if (country_data) { row.country_text = country_data[1]; }

        const data_language = row.language;
        const language_data = i18n_languages.find(language => language[2] === data_language);
        if (language_data) { row.language_text = language_data[1]; }
    
    }

    return {
        error: false,
        code: 200,
        data: data[0]
    };

};

const languages = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    return {
        error: false,
        code: 200,
        data: i18n_languages
    };

};

const countries = async (_args: never, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const data = i18n_countries.sort(function(a, b) {
        return b[1] < a[1] ? 1 : -1;
    });

    return {
        error: false,
        code: 200,
        data
    };

};

const timezones = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const country = args;

    const data = i18n_zones.filter(zone => zone[1] === country).sort(function(a, b) {
        return b[1] < a[1] ? 1 : -1;
    });

    return {
        error: false,
        code: 200,
        data
    };

};

const edit_save = async (args: any, _context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const {
        id,
        username,
        fullname,
        email,
        language,
        country,
        timezone,
        enabled,
        password
    } = args;

    const values: any = {
        username,
        fullname,
        email,
        language,
        country,
        timezone,
        enabled
    };

    if (password !== "") { values.password = await security.password_hash(password); }

    const data = await db.update({
        table: "users",
        values,
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

    const user_name = await db.selectv({ table: "users", columns: "username", where: id });

    if (user_name && user_name.toLowerCase() === "system") {

        return {
            error: true,
            code: 1006,
            message: codes(1006),
            data: null
        };

    } else {

        const data = await db.delete({
            table: "users",
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
        username,
        fullname,
        email,
        language,
        country,
        timezone,
        enabled,
        password
    } = args;

    const data = await db.insert({
        table: "users",
        values: {
            id: db.uuid(),
            username,
            fullname,
            email,
            language,
            country,
            timezone,
            enabled,
            created_by: user_id,
            created_ts: timestamp(),
            password: await security.password_hash(password)
        }
    });

    return {
        error: false,
        code: 200,
        data
    };

};

const toggle_enabled = async (args: any, context: ZombiAPIFunctionInputContext): Promise<ZombiExecuteReturnData> => {

    const id = args;

    if (id == 0) {

        return {
            error: true,
            code: 1007,
            message: codes(1007),
            data: null
        };

    } else {

        const data = await db.sql({
            sql: `update ${db.table_prefix()}users set enabled = case when enabled = 'Y' then 'N' else 'Y' end where id = :id`,
            bind: id
        });

        await security.reload_cache(context.request_id);
    
        return {
            error: false,
            code: 200,
            data
        };
    
    }

};



export {
    table,
    user_by_id,
    languages,
    countries,
    timezones,
    edit_save,
    edit_delete,
    create_save,
    toggle_enabled
};
