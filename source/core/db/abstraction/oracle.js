"use strict";

const config = require("../../config");
const log = require("../../log");

const oracledb = require("oracledb");

/*
    https://github.com/oracle/node-oracledb/blob/master/doc/api.md#oracledbconstantsdbtype

    oracledb.DB_TYPE_BINARY_DOUBLE 101     BINARY_DOUBLE
    oracledb.DB_TYPE_BINARY_FLOAT  100     BINARY_FLOAT
    oracledb.DB_TYPE_BLOB          113     BLOB
    oracledb.DB_TYPE_CHAR           96     CHAR
    oracledb.DB_TYPE_CLOB          112     CLOB
    oracledb.DB_TYPE_DATE           12     DATE
    oracledb.DB_TYPE_LONG            8     LONG
    oracledb.DB_TYPE_LONG_RAW       24     LONG RAW
    oracledb.DB_TYPE_NCHAR        1096     NCHAR
    oracledb.DB_TYPE_NCLOB        1112     NCLOB
    oracledb.DB_TYPE_NUMBER          2     NUMBER or FLOAT
    oracledb.DB_TYPE_NVARCHAR     1001     NVARCHAR
    oracledb.DB_TYPE_RAW            23     RAW
    oracledb.DB_TYPE_ROWID         104     ROWID
    oracledb.DB_TYPE_TIMESTAMP     187     TIMESTAMP
    oracledb.DB_TYPE_TIMESTAMP_LTZ 232     TIMESTAMP WITH LOCAL TIME ZONE
    oracledb.DB_TYPE_TIMESTAMP_TZ  188     TIMESTAMP WITH TIME ZONE
    oracledb.DB_TYPE_VARCHAR         1     VARCHAR2

*/
const get_data_type = (code) => {
    if (
        code === 12 ||
        code === 187 ||
        code === 232 ||
        code === 188
    ) {
        return "DATE";
    } else if (
        code === 101 ||
        code === 100 ||
        code === 8 ||
        code === 24 ||
        code === 2
    ) {
        return "NUMERIC";
    } else {
        return "STRING";
    }
};

const connect = async (db_name, callback) => {
    try {
        oracledb.autoCommit = true;

        oracledb.createPool({
            user: config.db[db_name].user,
            password: config.db[db_name].pass,
            connectString: "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=" + config.db[db_name].host + ")(PORT=" + config.db[db_name].port + "))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=" + config.db[db_name].name + ")))",
            // edition: 'ORA$BASE', // used for Edition Based Redefintion
            // events: false, // whether to handle Oracle Database FAN and RLB events or support CQN
            // externalAuth: false, // whether connections should be established using External Authentication
            // homogeneous: true, // all connections in the pool have the same credentials
            poolAlias: db_name // 'default' set an alias to allow access to the pool via a name.
            // poolIncrement: 1, // only grow the pool by one connection at a time
            // poolMax: 4, // maximum size of the pool. Increase UV_THREADPOOL_SIZE if you increase poolMax
            // poolMin: 0, // start with no connections; let the pool shrink completely
            // poolPingInterval: 60, // check aliveness of connection if idle in the pool for 60 seconds
            // poolTimeout: 60, // terminate connections that are idle in the pool for 60 seconds
            // queueTimeout: 60000, // terminate getConnection() calls in the queue longer than 60000 milliseconds
            // sessionCallback: myFunction, // function invoked for brand new connections or by a connection tag mismatch
            // stmtCacheSize: 30 // number of statements that are cached in the statement cache of each connection
        },
        err => {
            if (err) {
                log.debug(err, "oracle/connect", true);
                if (typeof callback === "function") { callback(err, false); }
            } else {
                log.debug("Connected to " + db_name + " oracle@" + config.db[db_name].host + ":" + config.db[db_name].port + "/" + config.db[db_name].name, "oracle/connect");
                if (typeof callback === "function") { callback(null, true); }
            }
        });
    } catch (err) { log.debug(err.message, "oracle/connect", true); }
};

const sql = (sql, bind, callback, db_name) => {
    try {
        let reply = { info: { db_name: db_name, db_type: config.db[db_name].type, rows: 0, fields: [] }, rows: null };

        oracledb.getConnection(db_name, (err, connection) => {
            if (err) {
                log.debug(err, "oracle/sql/connection", true);
                if (typeof callback === "function") { callback(err.message, false); }
            } else {
                connection.execute(
                    sql,
                    bind,
                    { extendedMetaData: true },
                    (err, result) => {
                        if (err) {
                            log.debug(err, "oracle/sql/execute", true);
                            if (typeof callback === "function") { callback(err, false); }
                        } else {
                            if (typeof result === "undefined") {
                                reply.info.rows = result.length;

                                result.metaData.forEach(field => {
                                    reply.info.fields.push({ name: field.name, type: get_data_type(field.dbType) });
                                });

                                reply = result;
                            } else {
                                reply.info.rows = result.rowsAffected;
                            }

                            callback(null, reply);
                        }

                        connection.close();
                    }

                );
            }
        });
    } catch (err) { callback(err.message, false); }
};

const shutdown = (db_name) => {
    try {
        log.debug("Shutting down Oracle connections", "oracle/shutdown");

        oracledb.getPool(db_name).close(1, (err) => {
            if (err) { log.debug(err.message, "oracle/shutdown", true); } else { log.debug("Oracle (" + config.db[db_name].host + ":" + config.db[db_name].port + "/" + config.db[db_name].name + ") disconnected", "oracle/shutdown"); }
        });
    } catch (err) { log.debug(err.message, "oracle/shutdown", true); }
};

module.exports = { connect, shutdown, sql };
