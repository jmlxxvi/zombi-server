import config from "../../config";

import { Client } from "pg";

import { ZombiDBClientsAbstraction, ZombiDBReplyData } from "../types";

const clients: ZombiDBClientsAbstraction = {};

export const connect = (db_name: string) => {

    if (typeof clients[db_name] === "undefined") {
        clients[db_name]  = new Client({
            user: config.db[db_name].user,
            host: config.db[db_name].host,
            database: config.db[db_name].name,
            password: config.db[db_name].pass,
            port: config.db[db_name].port,
            connectionTimeoutMillis: 5000
        });
    }

    return clients[db_name].connect();

};

export const sql = (sql: string, bind: string[], callback: (error: Error|null, reply: ZombiDBReplyData|false) => void, db_name: string) => {

    const reply: ZombiDBReplyData = {
        info: {
            db_name: db_name,
            db_type: config.db[db_name].type,
            rows: 0,
            identity: 0
        },
        rows: []
    };

    let bind_count = 0;

    // This is to use Oracle's style bindvars, meaning colon prefixed words as bind variables on the SQL text
    // so this transforms a SQL text like "where id = :id" to "where id = $1"
    // Please note that PG uses double colon for casting, for example column::integer so we check for it
    const pgized_sql = sql.replace(/'[^']+'|(:\S*\w)/g, (x, group1) => {
        if (!group1) { return x; }
        else if (x.indexOf("::") === -1) { return "$" + (++bind_count); }
        else { return x; }
    });

    const query = {
        text: pgized_sql,
        values: bind,
    };

    clients[db_name]
        .query(query)
        .then((res: any) => { // TODO use the appropiate type for PG response data

            if (typeof callback === "function") {

                reply.info.rows = res.rowCount;

                reply.rows = res.rows;

                callback(null, reply);

            }

        })
        .catch((error: Error) => {

            // https://www.postgresql.org/docs/current/errcodes-appendix.html
            if (typeof callback === "function") { callback(error, false); }

        });

};

export const disconnect = (db_name: string): void => { clients[db_name].end(); };


