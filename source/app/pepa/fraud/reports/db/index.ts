import db from "../../../../../core/db";

export const clients_onboarding_db = async () => {
    return db.sql(
        `select
            to_char(fc.creationdate, 'YYYY-MM-DD HH24:MI:SS') creationdate,
            fc.client_id,
            fc.phone,
            fc.legal,
            fc.email,
            fc.cuil,
            fc.occupation,
            fc."document",
            fc.address,
            od."match",
            od.ipaddress,
            od.status,
            to_char(od.created_at, 'YYYY-MM-DD') onboarding_date,
            to_char(od.created_at, 'HH24:MI:SS') onboarding_hour,
            od.reason
        from fintech_clients fc left join onboarding_data od on (fc.client_id = od.client_id)
        where fc.creationdate > now() - INTERVAL '24 HOURS'`
    );
};

// export default {
//     clients_onboarding_db
// };
