"use strict";

const config = require("../../config");
const log = require("../../log");

const mysql = require("mysql");

const clients = {};

// TODO this is incomplete, add more data type codes here
const get_data_type = (code) => {
    if (
        code === 10 ||
		code === 7
    ) {
        return "DATE";
    } else if (
        code === 3 ||
		code === 246
    ) {
        return "NUMERIC";
    } else {
        return "STRING";
    }
};

const connect = async (db_name, callback) => {

    try {

        if (typeof clients[db_name] === "undefined") {

            //https://github.com/mysqljs/mysql
            clients[db_name] = mysql.createPool({
                connectionLimit: 100,
                host: config.db[db_name].host,
                port: config.db[db_name].port,
                user: config.db[db_name].user,
                password: config.db[db_name].pass,
                database: config.db[db_name].name,
                charset: "utf8mb4_general_ci"
            });

            clients[db_name].on("error", (error) => {
                log.error(error.message, "mysql/connect");

                setTimeout(() => { connect(db_name, callback); }, 1000);
            });

            clients[db_name].on("connection", () => {
                // connection.query('SET SESSION auto_increment_increment=1')
                log.trace(`Connection to ${db_name} established`, "mysql/connect");
            });

        }

    } catch (error) { log.error(error, "mysql/connect"); }
};

const sql = (sql, bind, callback, db_name) => {

    let reply = {
        info: {
            db_name: db_name,
            db_type: config.db[db_name].type,
            rows: 0,
            fields: [],
            id: null
        },
        rows: []
    };

    // This is to use Oracle style bindvars, meaning colon prefixed words as bind variables on the SQL text
    // so this transforms a SQL text like "where id = :id" to "where id = ?"
    const mysql_sql = sql.replace(/'[^']+'|(:\S*\w)/g, (x, group1) => {
        if (!group1) return x;
        else return "?";
    });

    log.trace(`SQL (Transformed): ${mysql_sql.replace(/\s\s+/g, " ")}`, "mysql/sql");

    clients[db_name].query(

        { sql: mysql_sql },

        bind,

        (error, results, fields) => {

            if (error) {

                if (typeof callback === "function") { callback(error.message, false); }

                log.error(mysql_sql, "mysql/sql");
                log.error(error, "mysql/sql");

            } else {

                if (typeof callback === "function") {

                    if (fields) {

                        reply.info.rows = results.length;

                        fields.forEach(field => {

                            reply.info.fields.push({ name: field.name, type: get_data_type(field.type) });

                        });

                        reply = results;

                    } else {

                        reply.info.rows = results.affectedRows;
                        reply.info.identity = results.insertId;

                    }

                    callback(null, reply);
                }
            }
        }

    );
};

const disconnect = async db_name => { await clients[db_name].end(); };

module.exports = { connect, disconnect, sql };
