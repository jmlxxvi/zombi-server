

import config from "../../config";
import log from "../../log";
import db from "../index";

(async () => {

    if (config.schema.locked) {

        log.error("Schema is locked, check config file", "schema/create");

    } else {

        const table_prefix = config.schema.table_prefix;

        log.debug(`Using schema prefix "${table_prefix}"`, "schema/create");

        let schema;

        const db_type = config.db.default.type;

        switch (db_type) {
        case "postgresql": schema = require("./postgresql"); break;
        case "oracle": schema = require("./oracle"); break;
        case "mysql": schema = require("./mysql"); break;
        default: throw new Error("Wrong DB Type, check config file");
        }

        await db.connect("schema");

        const commands = schema.create_schema(table_prefix);

        for (const sql of commands) {

            try {

                await db.sql({ sql });

            } catch (error) {

                log.error(error, "schema/create");

                process.exit(1);

            }

        }

    }

    process.exit(0);

})();
