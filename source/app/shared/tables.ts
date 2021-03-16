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

const _response = (rows: number, total: number, filtered: number, draw = 0) => {

    return {
        draw,
        recordsTotal: total,
        recordsFiltered: filtered,
        data: rows
    };

};

export const data = (rows: number, total: number, filtered: number, draw = 0) => {

    return _response(rows, total, filtered, draw);

};

export const sql = async (
    { sql, page, size, order, search, dir = "asc", db_name = "default", download = false, bind = [] }:
    { sql: string, page: number, size: number, order: any, search: string, dir: string, db_name?: string, download?: boolean, bind?: any[] }
) => {

    console.log(download);

    const db_type = config.db[db_name].type;

    const raw_sql = sql;

    let bind_count = 0;

    let bindVars: any[] = [];

    let sql_text;

    switch (db_type) {

    case "postgresql":
        sql_text = raw_sql.replace(/:search/g, () => { bindVars.push(search); return "$" + (++bind_count); });
        break;

    case "mysql":
        sql_text = raw_sql.replace(/:search/g, () => { bindVars.push(search); (++bind_count); return "?"; });
        break;

    case "oracle":
        // TODO implement
        break;

    default:
        log.error("Database setup error", "datatables/sql");
        throw new Error(`Database setup error: ${__filename}`);

    }

    bindVars = [...bindVars, ...bind];
    const paging = [...bindVars];

    // if (download) {

    //     sql_text += " order by " + order + "" + dir;

    //     const rows = [];

    //     const resp = await db.sql({
    //         sql: sql_text,
    //         bindVars,
    //         db_name
    //     });

    //     for (const s of resp) { rows.push(s); }

    //     return rows;

    // } else {

    if (true) { // eslint-disable-line no-constant-condition

        const count_sql = "select count(*) from (" + sql_text + ") inq";

        if (order) { sql_text += ` order by ${order} ${dir ? " asc" : " desc"}`; }

        switch (db_type) {

        case "postgresql":
            sql_text += ` limit $${++bind_count} offset $${++bind_count}`;
            paging.push(size);
            paging.push(page * size);
            break;

        case "mysql":
            sql_text += " limit :limit offset :offset";
            ++bind_count;
            ++bind_count;
            paging.push(size);
            paging.push(page * size);
            break;

        case "oracle":

            sql_text = `select sq.*
                                from
                                (
                                    select inq.*, rownum as rn
                                    from (${sql_text}) inq
                                    where rownum <= :limit
                                ) sq
                                where sq.rn > :offset`;
            paging.push((page * size) + size);
            paging.push(page * size);
            break;
        }

        const count = await db.sqlv({ sql: count_sql, bind:bindVars, db_name });

        const rows = await db.sql({ sql: sql_text, bind: paging, db_name });

        return { rows, count };

    }

};


