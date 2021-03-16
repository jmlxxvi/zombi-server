// TODO map completely the config object

import { ZombiLogErrorLevels } from "./log/types";

type ZombiConfig = {
    schema: {
        locked: boolean,
        table_prefix: string
    },
    log: {
        level: ZombiLogErrorLevels,
        persist: {
            [key: string]: any
        }
    },
    [key: string]: any
}

const config: ZombiConfig = {

    schema: {
        locked: process.env.ZOMBI_DB_SCHEMA_LOCKED !== "false",
        table_prefix: process.env.ZOMBI_DB_PREFIX ?? ""
    },

    db: {
        default: {
            user: process.env.ZOMBI_DB_USER || "the_db_user",
            host: process.env.ZOMBI_DB_HOST || "the_db_host",
            port: process.env.ZOMBI_DB_PORT || 3306,
            pass: process.env.ZOMBI_DB_PASS || "the_db_password",
            name: process.env.ZOMBI_DB_NAME || "the_db_name",
            type: process.env.ZOMBI_DB_TYPE || "mysql", // oracle, mysql or postgresql
            enabled: true
        }
    },

    cache: {
        host: process.env.ZOMBI_CACHE_HOST || "localhost",
        port: process.env.ZOMBI_CACHE_PORT || 6379,
        pass: process.env.ZOMBI_CACHE_PASS || "the_cache_password",
        tls: (process.env.ZOMBI_CACHE_TLS === "true"),
        load_scripts: (process.env.ZOMBI_CACHE_LOAD_SCRIPTS === "true"),
        cache_prefix: "ZOMBI_WEBSOCKETS"
    },

    i18n: {
        default_language: "es",
        default_country: "AR",
        default_timezone: "America/Argentina/Buenos_Aires"
    },

    security: {
        auth_header_key: process.env.ZOMBI_AUTH_HEADER_KEY || "none",
        auth_header_value: process.env.ZOMBI_AUTH_HEADER_VALUE || "none",
        hide_server_errors: (process.env.ZOMBI_HIDE_SERVER_ERRORS === "true"),
        salt_rounds: 10,
        token_size: 64,
        public_modules: ["system/public", "pepa/security/public"],
        hidden_modules: ["system/hidden"],
        hmac_secret: process.env.ZOMBI_SESSION_HMAC_SECRET || "no_secret!",
        cors: {
            headers: "*",
            origin: "*",
            methods: "*"
        },
        log_arguments: (process.env.ZOMBI_LOG_ARGUMENTS === "true"),
        cache_key: "ZOMBI_AUTH_MODULE",
        pasword_recovery_token_life: 60, // minutes
        notifications: {
            email: {
                user: process.env.ZOMBI_NOTIFICATIONS_EMAIL_USER,
                pass: process.env.ZOMBI_NOTIFICATIONS_EMAIL_PASS,
                url: process.env.ZOMBI_NOTIFICATIONS_EMAIL_URL
            }
        }
    },

    log: {
        level: (process.env.ZOMBI_LOG_LEVEL ?? "DEBUG") as ZombiLogErrorLevels, // DISABLED, FATAL, ERROR, WARN, INFO, DEBUG, TRACE
        persist: {
            enabled: (process.env.ZOMBI_LOG_PERSIST === "true") || false,
            max_hours: 2,
            max_items: 200,
            cache_key: "ZOMBI_LOG_PERSIST"
        }
    },

    stats: {
        enabled: (process.env.ZOMBI_STATS_ENABLED === "true"),
        cache_prefix: "ZOMBI_STATS"
    },

    session: {
        cache_prefix: "ZOMBI_SESSION",
        expire: 60 // seconds
    },

    sockets: {
        ping_response_time_limit: 2000, // milliseconds
        reconnect_time: 2000 // milliseconds
    },

    client: {
        endpoint: process.env.ZOMBI_CLIENT_ENDPOINT || "http://localhost:8000/server"
    },

    server: {
        endpoint: process.env.ZOMBI_SERVER_ENDPOINT || "/server",
        timeout: parseInt(process.env.ZOMBI_SERVER_TIMEOUT || "10000")
    },

    gateway: {
        http_port: 8000,
        http_ip: "0.0.0.0"
    },

    firebase: {
        messaging: {
            url: process.env.ZOMBI_FIREBASE_MESSAGING_URL,
            server_key: process.env.ZOMBI_FIREBASE_MESSAGING_KEY
        }

    },

    storage: { path: process.env.ZOMBI_STORAGE_PATH }

};


export default config;