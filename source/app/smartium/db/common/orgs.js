const db = require("../../../../core/db");

const { is_superadmin } = require("../../logic/common");

const user_organizations = async user_id => {

    let orgs;

    if (await is_superadmin()) {

        orgs = await db.sql(
            `select distinct
				1 as "user_id",
				org.id as "organization_id",
				ora.description as "organization_name"
			from organizations org
				join organization_attributes ora on ora.id_organization = org.id and ora.id_attribute = 1
			where 1 = 1
			and org.active = 1
			order by 3, 1`,
            []
        );

    } else {

        orgs = await db.sql(
            `select
				usr.id as "user_id",
				org.id as "organization_id",
				ora.description as "organization_name"
			from users usr
				left join organization_users oru on oru.id_user = usr.id
				left join organizations org on org.id = oru.id_organization
				-- Attributes
				left join user_attributes usa on usa.id_user = usr.id and usa.id_attribute = 1
				left join organization_attributes ora on ora.id_organization = org.id and ora.id_attribute = 1
			where 1 = 1
			and usr.id = :user_id
			and oru.active = 1
			and org.active = 1
			and usr.active = 1
			order by 1, 3`,
            user_id
        );

    }

    return orgs;

};

module.exports = {
    user_organizations
};