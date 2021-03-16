import db from "../../../../../core/db";

export const getPendingTransactions = async () => {
    const items = await db.sql(
        "select client_id, fields, pending_tran_id from op_pending_transactions where status = 'PENDING'"
    );
    return items.map(e => ({
        ...e,
        fields:(e.fields != "") ? JSON.parse(e.fields) : []
    }));

};
