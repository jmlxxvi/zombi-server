import config from "../../core/config";
import log from "../../core/log";
import db from "../../core/db";

/*

Example of data sent by the client

{

    "draw": 1,
    "columns": [{
        "data": 0,
        "name": "employee_name",
        "searchable": true,
        "orderable": true,
        "search": {
            "value": "",
            "regex": false
        }
    }, {
        "data": 1,
        "name": "department",
        "searchable": true,
        "orderable": true,
        "search": {
            "value": "",
            "regex": false
        }
    }],
    "order": [{
        "column": 0,
        "dir": "asc"
    }],
    "start": 0,
    "length": 10,
    "search": {
        "value": "",
        "regex": false
    }

}

Example of response

const response = {
    "draw": context.sequence,
    "recordsTotal": 57,
    "recordsFiltered": 57,
    "data": [
        [
        "Airi",
        "Satou",
        "Accountant",
        "Tokyo",
        "28th Nov 08",
        "$162,700"
        ],
        [
        "Angelica",
        "Ramos",
        "Chief Executive Officer (CEO)",
        "London",
        "9th Oct 09",
        "$1,200,000"
        ]
    ]
};

*/

const _response = (rows: any, total: number, filtered: number, draw = 0) => {

    return {
        draw,
        recordsTotal: total,
        recordsFiltered: filtered,
        data: rows
    };

};

export const data = (rows: any, total: number, filtered: number, draw = 0) => {

    return _response(rows, total, filtered, draw);

};

export const sql = async (args: any) => {

    const db_name = args.db_name ? args.db_name : "default";

    const db_type = config.db[db_name].type;

    const data = args.data;

    const raw_sql = args.sql;

    let bind_count = 0;

    const bind: any[] = [];

    let sql;

    switch (db_type) {

    case "postgresql":
        sql = raw_sql.replace(/:search/g, () => { bind.push(data.search.value); return "$" + (++bind_count); });
        break;

    case "mysql":
        sql = raw_sql.replace(/:search/g, () => { bind.push(data.search.value); (++bind_count); return "?"; });
        break;

    case "oracle":
        // TODO implement
        break;

    default:
        log.error("Database setup error", "datatables/sql");
        throw new Error(`Database setup error: ${__filename}`);

    }

    const paging = [...bind];

    if (args.download) {

        sql += " order by " + (data.order[0].column + 1) + ((data.order[0].dir === "asc") ? " asc" : " desc");

        const rows = [];

        const resp = await db.sql({
            sql,
            bind,
            db_name
        });

        for (const s of resp) { rows.push(s); }

        return rows;

    } else {

        let search_columns = "";

        data.columns.forEach((col: any) => {
            if (col.searchable && col.search.value !== "") {
                search_columns += `and ${col.name} = '${col.search.value}' `;
            }
        });

        if (search_columns) {
            sql = `select * from (${sql}) inq2 where 1=1 ${search_columns}`;
        }

        let count;

        switch (db_type) {

        case "postgresql":
            count = "select count(*) from (" + sql + ") inq";
            break;

        case "mysql":
            count = "select count(*) from (" + sql + ") inq";
            break;

        case "oracle":
            count = "select count(*) from (" + sql + ") inq";
            break;

        default:
            log.error("Database setup error", "datatables/sql");
            throw new Error(`Database setup error: ${__filename}`);

        }

        if (data.order[0]) { sql += " order by " + (data.order[0].column + 1) + ((data.order[0].dir === "asc") ? " asc" : " desc"); }

        switch (db_type) {

        case "postgresql":
            sql += ` limit $${++bind_count} offset $${++bind_count}`;
            paging.push(data.length);
            paging.push(data.start);
            break;

        case "mysql":
            sql += " limit ? offset ?";
            ++bind_count;
            ++bind_count;
            paging.push(data.length);
            paging.push(data.start);
            break;

        case "oracle":

            sql = `select sq.*
                            from
                            (
                                select inq.*, rownum as rn
                                from (${sql}) inq
                                where rownum <= :limit
                            ) sq
                            where sq.rn > :offset`;
            paging.push(data.start + data.length);
            paging.push(data.start);
            break;
        }

        const count_results = await db.sqlv({ sql: count, bind, db_name });

        const paging_results = await db.sql({ sql, bind: paging, db_name });

        return _response(paging_results, count_results, count_results);

    }

};


