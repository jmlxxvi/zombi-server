const db = require("../../../../core/db");

const is_superadmin = async user_id => {

    const superadmin_flag = await db.sqlv(
        "select superadmin_flag from users where id = :user_id",
        [user_id]
    );

    return superadmin_flag === "Y";

};

module.exports = { is_superadmin };