const db = require("../../../../core/db");

const user_attributes = async (value, filter = "email") => {

    let sql_filter = "";

    switch (filter) {
    case "email": sql_filter = " ua2.description = :value "; break;
    case "id": sql_filter = " usr.id = :value "; break;
    case "name": sql_filter = " ua3.description = :value "; break;
    }
    
    const sql = `select
                    usr.id as "user_id",
                    uat.description as "user_password",
                    ua2.description as "user_email",
                    ua3.description as "user_name",
                    ua4.description as "user_document",
                    ua5.description as "user_phone_no",
                    alerts_flag
                from users usr
                    left join user_attributes uat on uat.id_user = usr.id and uat.id_attribute = 4
                    left join user_attributes ua2 on ua2.id_user = usr.id and ua2.id_attribute = 3
                    left join user_attributes ua3 on ua3.id_user = usr.id and ua3.id_attribute = 1
                    left join user_attributes ua4 on ua4.id_user = usr.id and ua4.id_attribute = 18
                    left join user_attributes ua5 on ua5.id_user = usr.id and ua5.id_attribute = 7
                where 1=1
                and ${sql_filter}
                and	usr.active = 1
                and	uat.active = 1
                and	ua2.active = 1
                and	ua3.active = 1
                limit 1`;

    return db.sqlr(sql, value);

};

module.exports = {
    user_attributes
};