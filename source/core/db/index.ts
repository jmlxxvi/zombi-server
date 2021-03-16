import config from "../config";
import log from "../log";
import { timestamp, uuid } from "../utils";
import stats from "../stats";

import { promises as fs } from "fs";

import path from "path";

import { ZombiDBReplyData, ZombiDBReplyDataRow, ZombiDBReplyDataInfo } from "./types";

const db: {
    [key: string]: any
} = {};

/**
 * Connects to the database defined on config
 * See server/core/config
 * @param request_id - The transaction request ID
 * @return Promise[void]
 */
const connect = async (request_id: string) => {

    const databases = Object.keys(config.db);

    for (const db_name of databases) {

        if (db[db_name]) {

            return true;

        } else {

            if (config.db[db_name].enabled === true) {

                const db_type = config.db[db_name].type;
    
                switch (db_type) {
    
                case "postgresql": db[db_name] = require("./abstraction/postgresql"); break;
                        
                case "oracle": db[db_name] = require("./abstraction/oracle"); break;
                        
                case "mysql": db[db_name] = require("./abstraction/mysql"); break;
                        
                default: throw new Error("Wrong DB Type, check config file");
    
                }

                try {

                    return db[db_name].connect(db_name);

                } catch (error) { log.error(error, `db/${db_type}/connect`, request_id); }

                log.info(`Connected to db [${db_name}] ${db_type}@${config.db[db_name].host}:${config.db[db_name].port}/${config.db[db_name].name}`, "db/connect", request_id);
    
            }

        }

    }

};

/**
 * Diconnects from the database defined on config
 * See server/core/config
 * @param request_id - The transaction request ID
 * @return Promise{void}
 */
const disconnect = async (request_id: string) => {

    const databases = Object.keys(config.db);

    for (const db_name of databases) {

        if (config.db[db_name].enabled === true && db[db_name]) {

            await db[db_name].disconnect(db_name);

            log.info(`Disconnected from db [${db_name}]`, "db/disconnect", request_id);
        }

    }

};

const _get_params = (args: any[]) => {

    let sql = "";
    let bind: any[] = [];
    let db_name = "default";
    let info = false;

    if (typeof args[0] === "string") {

        sql = args[0];
        bind = typeof args[1] === "undefined" ? bind : args[1];
        db_name = typeof args[2] === "undefined" ? db_name : args[2];
        info = typeof args[3] === "undefined" ? info : args[3];

    } else if (Array.isArray(args[0])) {

        sql = args[0][0];
        bind = typeof args[0][1] === "undefined" ? bind : args[0][1];
        db_name = typeof args[0][2] === "undefined" ? db_name : args[0][2];
        info = typeof args[0][3] === "undefined" ? info : args[0][3];

    } else if (!!args[0] && (args[0].constructor === Object)) {

        sql = args[0].sql;
        bind = typeof args[0].bind === "undefined" ? bind : args[0].bind;
        db_name = typeof args[0].db_name === "undefined" ? db_name : args[0].db_name;
        info = typeof args[0].info === "undefined" ? info : args[0].info;

    } else { throw new Error("Invalid parameters for DB query"); }

    if (!Array.isArray(bind)) { bind = [bind]; }

    return { sql, bind, db_name, info };

};

/**
 * Returns the contents of the SQL file stored on server/dba/sql
 * This function is used to use database funtions with the contents fo the file instead of passing the SQL text con as a parameter
 * @param f - The file name
 * @return The file contents
 */
const file = async (f: string): Promise<string> => {

    const file = path.resolve(__dirname, "../../dba/sql/", f);

    return (await fs.readFile(file)).toString();

};

type ZombiDBSQLArgumentsArray = [
    string, 
    string[] | number[], 
    string, 
    boolean
];

type ZombiDBSQLArgumentsObject = {
    sql: string,
    bind?: string[] | number[],
    db_name?: string,
    info?: boolean
}

const _sql = (
    arg1: string | ZombiDBSQLArgumentsArray | ZombiDBSQLArgumentsObject, 
    arg2?: string[] | number[], 
    arg3?: string
): Promise<ZombiDBReplyData> => {

    const start_time = timestamp(true);

    return new Promise((resolve, reject) => {

        const { sql, bind, db_name } = _get_params([arg1, arg2, arg3]);

        if (!sql) { throw new Error("Empty SQL query text"); }

        if (db[db_name]) {

            db[db_name].sql(
                sql,
                bind,
                async (err: Error, res: ZombiDBReplyData) => {
                    if (err) {
                        stats.up("db-errors-time", timestamp(true) - start_time);
                        stats.up("db-errors-count");

                        err.message = `${err.message} SQL: ${sql} BIND: [${bind.join(", ")}]`;

                        reject(err); 
                    
                    } else {
                        stats.up("db-time", timestamp(true) - start_time);
                        stats.up("db-count");

                        resolve(res);
                    }
                },
                db_name
            );

        } else {

            throw new Error(`Database ${db_name} is not connected`);

        }

    });

};

const sqlg = async (...args: any[]): Promise<ZombiDBReplyDataRow[]> => {

    const { sql, bind, db_name } = _get_params(args);
    const data = await _sql({ sql, bind, db_name });

    return data.rows;

};

const dml = async (...args: any[]): Promise<ZombiDBReplyDataInfo> => {

    const { sql, bind, db_name } = _get_params(args);
    const data = await _sql({ sql, bind, db_name });

    return data.info;

};

const sqlv = async (...args: any[]) => {

    const { sql, bind, db_name } = _get_params(args);
    const data = await _sql({ sql, bind, db_name });
    const rows = data.rows;
    const value = rows.length > 0 ? rows[0][Object.keys(rows[0])[0]] : null;

    return value;

};

const sqlr = async (...args: any[]) => {

    const { sql, bind, db_name } = _get_params(args);
    const data = await _sql({ sql, bind, db_name });
    const rows = data.rows;
    const value = rows.length > 0 ? rows[0] : null;

    return value;

};

/**
 * Returns the next value from the native sequence
 * @param db_name - The database configured on core/config
 * @return The sequence value
 */
const sequence = async (db_name = "default"): Promise<number> => {

    let res = null;

    const db_type = config.db[db_name].type;

    switch (db_type) {

    case "postgresql":
        // CREATE SEQUENCE IF NOT EXISTS zombi_seq START 1;
        res = await _sql({ sql: "select nextval('zombi_seq')::integer as seq" });

        break;

    case "oracle":
        // CREATE SEQUENCE zombi_seq INCREMENT BY 1 START WITH 1;
        res = await _sql({ sql: "select zombi_seq.nextval as \"seq\" from dual" });

        break;

    case "mysql":
        /*
        This may work on MariaDB 10.3: https://mariadb.com/kb/en/library/create-sequence/
        Also it may be possible to implement what is shown here: https://www.convert-in.com/docs/mysql/sequence.htm
        */
        res = await _sql({ sql: "select nextval('zombi_sequence')" });

        break;

    default: throw new Error("Wrong DB Type, check config file");

    }

    return res.rows[0]["seq"];

};

const table_prefix = (): string => { return config.schema.table_prefix; };

type ZombiDBSQLWhereInput = null | number | string | [string, any] | {[key: string]: any}

type ZombiDBSQLColumnsInput = null | string | string[];

type ZombiDBSQLOrderByInput = null | number | string | string[] | number[] | {[key: string]: string};

type ZombiDBSQLSelectInput = {
    table: string,
    where?: ZombiDBSQLWhereInput,
    columns?: ZombiDBSQLColumnsInput,
    db_name?: string,
    info?: boolean,
    order_by?: ZombiDBSQLOrderByInput
}

/**
 * Selects rows from the table passed as parameter
 * @param params
 * @param params.table - The name of the table to delete from
 * @param params.where - The filter expression, see _filter()
 * @param params.columns - The columns to return. See _columns()
 * @param params.db_name - The database configured on core/config
 * @param params.info - The flag indicating the results have additiona info besides the rows returned
 * @param params.order_by - The order of the results. See _order_by()
 * @return An array with the rows returned from the query or an empty array if no rows were found
 */
const select = async ({ table, where = null, columns = null, db_name = "default", order_by = null }: ZombiDBSQLSelectInput): Promise<ZombiDBReplyDataRow[]> => {

    const { sql_where, bind } = _filter(where);

    const sql_columns = _columns(columns);

    const sql_order_by = _order_by(order_by);

    const sql = `select ${sql_columns} from ${table} where ${sql_where} ${sql_order_by}`;

    const results = await _sql(sql, bind, db_name);

    return results.rows;

};

type ZombiDBSQLSelectVInput = {
    table: string,
    where?: ZombiDBSQLWhereInput,
    columns: ZombiDBSQLColumnsInput,
    db_name?: string
}

/**
 * Selects a value from the table passed as parameter
 * @param params
 * @param params.table - The name of the table to delete from
 * @param params.where - The filter expression, see _filter()
 * @param params.columns - The columns to return. See _columns()
 * @param params.db_name - The database configured on core/config
 * @return The value found or null if no the query returns empty
 */
const selectv = async ({ table, where = null, columns = null, db_name }: ZombiDBSQLSelectVInput) => {

    const results = await select({ table, where, columns, db_name, info: false, order_by: null });

    return results.length === 0 ? null : Object.values(results[0])[0];

};

type ZombiDBSQLSelectRInput = {
    table: string,
    where?: ZombiDBSQLWhereInput,
    columns?: ZombiDBSQLColumnsInput,
    db_name?: string
}

/**
 * Selects a single row from the table passed as parameter
 * @param params
 * @param params.table - The name of the table to delete from
 * @param params.where - The filter expression, see _filter()
 * @param params.columns - The columns to return. See _columns()
 * @param params.db_name - The database configured on core/config
 * @return The row found or null if no the query returns empty
 */
const selectr = async ({ table, where = null, columns = null, db_name = "default" }: ZombiDBSQLSelectRInput) => {

    const results = await select({ table, where, columns, db_name, info: false, order_by: null });

    return results.length === 0 ? null : results[0];

};

/**
 * Generates the order by clause to add to the sql query
 * Null means no order
 * A string or a number returns order by the column name or column number defaulted to ascending order
 * An array is converted the columns to order, separated by commas
 * An object uses the keys as columns to order and the values as the sorting direction, like ASC or DESC
 * @param order_by - The order expression
 * @return The order by string to add to the sql query
 */
const _order_by = (order_by: ZombiDBSQLOrderByInput): string => {

    let sql_order_by;

    if (order_by === null) {

        sql_order_by = "";

    } else if (Array.isArray(order_by)) {

        sql_order_by = "order by " + order_by.join(", ");

    } else if (typeof order_by === "object") {

        sql_order_by = "order by ";

        for (const key of Object.keys(order_by)) {

            const order_column = key;

            const order_direction = ((order_by[key] + "").toUpperCase())  === "ASC" ? "ASC" : "DESC";

            sql_order_by += `${order_column} ${order_direction}, `;

        }

        sql_order_by = sql_order_by.slice(0, -2);

    } else {

        sql_order_by = "order by " + order_by;

    }

    return sql_order_by;

};

type ZombiDBSQLUpdateInput = {
    table: string,
    where?: ZombiDBSQLWhereInput,
    values: { [key: string]: any },
    db_name?: string
}

/**
 * Updates the rows matching the filter criteria from the table passed as parameter
 * The identity parameter defines id the identity column is returned from the function
 * @param params
 * @param params.table - The name of the table to delete from
 * @param params.where - The filter expression, see _filter()
 * @param params.values - An object that represents the values to insert. The keys are the columns and the values the inserted values.
 * @param params.db_name - The database configured on core/config
 * @return The affected rows on the insert operation
 */
const update = async ({ table, where = null, values = {}, db_name = "default" }: ZombiDBSQLUpdateInput) => {

    const { sql_where, bind } = _filter(where);

    const bind_set: any[] = [];

    const sql_set = Object.keys(values).map(key => { bind_set.push(values[key]); return `${key} = :${key}`; }).join(", ");

    const sql = `update ${table} set ${sql_set} where ${sql_where}`;

    const bind_total = [ ...bind_set, ...bind ];

    const results = await _sql(sql, bind_total, db_name);

    return results.info;

};

type ZombiDBSQLInsertInput = {
    table: string,
    values: { [key: string]: any },
    db_name?: string,
    identity?: boolean | string
}

/**
 * Inserts the row defined on the parameter values on the table passed as parameter
 * The identity parameter defines id the identity column is returned from the function
 * @param params
 * @param params.table - The name of the table to delete from
 * @param params.values - An object that represents the values to insert. The keys are the columns and the values the inserted values.
 * @param params.db_name - The database configured on core/config
 * @param params.identity - Defines is the identity column is returned
 * @return The affected rows on the insert operation
 */
const insert = async ({ table, values = {}, db_name = "default", identity = false }: ZombiDBSQLInsertInput) => {

    const sql_columns = Object.keys(values).join(", ");
    const sql_values = Object.keys(values).join(", :");

    const bind = Object.values(values);

    let identity_column = null;

    if (identity === true) {

        identity_column = "id";

    } else if (identity !== false) {

        identity_column = identity + "";

    }

    let sql = `insert into ${table} (${sql_columns}) values (:${sql_values})`;

    if (identity_column !== null) { sql += ` returning ${identity_column}`; }

    const results = await _sql(sql, bind, db_name);

    // TODO this is for PostgreSQL, for other DBs would be different, for MySQL check https://github.com/mysqljs/mysql#getting-the-id-of-an-inserted-row
    if (identity_column !== null) { results.info.identity = results.rows[0][identity_column]; }

    return results.info;

};

type ZombiDBSQLDeleteInput = {
    table: string,
    where?: ZombiDBSQLWhereInput,
    db_name?: string
}

/**
 * Deletes the rows matching the filter criteria from the table passed as parameter
 * @param params
 * @param params.table - The name of the table to delete from
 * @param params.where - The filter expression, see _filter()
 * @param params.db_name - The database configured on core/config
 * @return The affected rows on the delete operation
 */
const _delete = async ({ table, where = null, db_name = "default" }: ZombiDBSQLDeleteInput) => {

    const { sql_where, bind } = _filter(where);

    const sql = `delete from ${table} where ${sql_where}`;

    const results = await _sql(sql, bind, db_name);

    return results.info;

};

/**
 * Returns an string representing a where clause and the bind variables associated with the expression
 * Null means no filter
 * A string or a number represents a comparison with the column id
 * An array is converted from [column1:value1, column2:value2...] to the appropiate filter expresion
 * An object uses the keys as columns and the values as the filtering values
 * @param filter - The filter expression
 * @return The filter expression
 */
const _filter = (filter: null | number | string | string[] | {[key: string]: any}): { sql_where: string, bind: any[] }  => {

    let sql_where, index = 1;
    const bind = [];

    if (filter === null) {

        sql_where = "1 = 1";

    } else if (Array.isArray(filter)) {

        sql_where = `${filter[0]} = :${filter[0]}`;
        bind.push(filter[1]);

    } else if (typeof filter === "object") {

        sql_where = "1 = 1";

        for (const key of Object.keys(filter)) {

            sql_where += ` and ${key} = :bind${(index++).toString()}`;
            bind.push(filter[key]);

        }

    } else {

        sql_where = " id = :id";
        bind.push(filter);

    }

    return { sql_where, bind };

};

/**
 * Returns an string for the columns to be included on the select statement
 * Null value returns *
 * An array is converted to a comma separated string
 * @param columns - The definition of columns on the select
 * @return The columns expression
 */
const _columns = (columns: null | string | string[]): string => {

    let sql_columns;

    if (columns === null) {

        sql_columns = "*";

    } else if (Array.isArray(columns)) {

        sql_columns = columns.join(", ");

    } else {

        sql_columns = columns + "";

    }

    return sql_columns;

};

/**
 * Returns the database version string
 * @param db_name - The database configured on core/config
 * @return The database version string
 */
const version = async (db_name = "default"): Promise<string> => {

    let res = null;

    const db_type = config.db[db_name].type;

    switch (db_type) {

    case "postgresql":
        res = await sqlv({ sql: "select version()" });

        break;

    case "oracle":
        res = await sqlv({ sql: "SELECT * FROM v$version WHERE banner LIKE 'Oracle%'" });

        break;

    case "mysql":
        res = await sqlv({ sql: "SELECT VERSION()" });

        break;

    default: throw new Error("Wrong DB Type, check config file");

    }

    return res;
    
};

const _uuid = () => uuid();

export default {
    sql: sqlg,
    sqlv,
    sqlr,
    dml,
    sequence,
    connect,
    disconnect,
    table_prefix,
    select,
    selectv,
    selectr,
    delete: _delete,
    insert,
    update,
    file,
    version,
    uuid: _uuid
};
