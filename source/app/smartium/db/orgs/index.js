const db = require("../../../../core/db");

const organization_silobags = async (organization_id) => {

    const sql =
		`select
			orc.id_organization as "organization_id",
			org.created_at as "organization_creation_date",
			ora.description as "organization_name",
			com.id as "company_id",
			com.created_at as "company_creation_date",
			coa.description as "company_name",
			cou.id as "countryside_id",
			cou.created_at as "countryside_creation_date",
			csa.description as "countryside_name",
			cs1.description as "countryside_latitude",
			cs2.description as "countryside_longitude",
			lot.id as "lot_id",
			lot.created_at as "lot_creation_date",
			loa.description as "lot_name",
			sil.id as "silobag_id",
			sil.created_at as "silobag_creation_date",
			sb3.description as "silobag_confection_date",
			sb4.description as "silobag_extraction_date",
			sba.description as "silobag_name",
			sbt.description as "silobag_type",
			sbt.id as "silobag_type_id",
			sbh.description as "harvest",
			sbp.description as "production",
			sb2.description as "meters"
		from organizations org
			left join organization_companies orc on orc.id_organization = org.id
			left join companies com on com.id = orc.id_company
			left join company_countrysides cco on cco.id_company = com.id
			left join countrysides cou on cou.id = cco.id_countryside
			left join countryside_lots csl on csl.id_countryside = cou.id
			left join lots lot on lot.id = csl.id_lot
			left join lot_silobags lsb on lsb.id_lot = lot.id
			left join silobags sil on sil.id = lsb.id_silobag
			left join silobag_types sbt on sbt.id = sil.id_silobag_type
			left join silobag_particles sbp on sbp.id = sil.id_silobag_particle
			left join silobag_harvests sbh on sbh.id = sil.id_silobag_harvest
			-- Attributes
			left join silobag_attributes sba on sba.id_silobag = sil.id and sba.id_attribute = 1  -- name
			left join silobag_attributes sb2 on sb2.id_silobag = sil.id and sb2.id_attribute = 25 -- size
			left join silobag_attributes sb3 on sb3.id_silobag = sil.id and sb3.id_attribute = 26 -- confection_date
			left join silobag_attributes sb4 on sb4.id_silobag = sil.id and sb4.id_attribute = 27 -- extraction_date
			left join lot_attributes loa on loa.id_lot = lot.id and loa.id_attribute = 1
			left join countryside_attributes csa on csa.id_countryside = cou.id and csa.id_attribute = 1
			left join countryside_attributes cs1 on cs1.id_countryside = cou.id and cs1.id_attribute = 12
			left join countryside_attributes cs2 on cs2.id_countryside = cou.id and cs2.id_attribute = 13
			left join company_attributes coa on coa.id_company = com.id and coa.id_attribute = 1
			left join organization_attributes ora on ora.id_organization = org.id and ora.id_attribute = 1
		where 1 = 1
			and org.id = :org_id
			and orc.active = 1
			and com.active = 1
			and org.active = 1
			and cco.active = 1
			and cou.active = 1
			and csl.active = 1
			and lot.active = 1
			and lsb.active = 1
			and sil.active = 1`;
    // TODO: en esta consulta traemos todas las silobolsas? incluso las extraidas?

    return db.sql(
        sql,
        organization_id
    );

};

const organization_devices = async (organization_id, only_unassigned = false) => {

    const sql =
		`SELECT
            dev.id AS "device_id",
            devEUI.description AS "device_EUI",
            devName.description AS "device_name",
            devModel.description AS "device_version",
            devT.description AS "device_type",
            UNIX_TIMESTAMP(dev.created_at) AS "creation_timestamp",
            orgName.description AS "org_name",
            devS.description AS "device_status",
            s2.id as "silobag_id"
        FROM devices dev
            -- Device detailed description
            JOIN device_types devT ON devT.id = dev.id_device_type
            JOIN device_statuses devS ON devS.id = dev.id_device_status
            LEFT JOIN silobag_devices sd ON sd.id_device = dev.id
            LEFT JOIN silobags s2 ON s2.id = sd.id_silobag 
            -- Device Attributes
            JOIN device_attributes devEUI ON devEUI.id_device = dev.id AND devEUI.id_attribute = 15
            JOIN device_attributes devName ON devName.id_device = dev.id AND devName.id_attribute = 1
            JOIN device_attributes devModel ON devModel.id_device = dev.id AND devModel.id_attribute = 22
            -- LEFT JOIN device_attributes devSerial ON devSerial.id_device = dev.id AND devSerial.id_attribute = 29
            -- Organization
            JOIN organization_devices orgdev ON orgdev.id_device = dev.id
            JOIN organizations org ON org.id = orgdev.id_organization
            JOIN organization_attributes orgName ON orgName.id_organization = org.id AND orgName.id_attribute = 1
        WHERE 1 = 1
            AND dev.active = 1
            ${only_unassigned ? " and s2.id is NULL" : ""}
            and org.id = :org_id`;

    return db.sql(
        sql,
        organization_id
    );

};


const organization_lots = async (organization_id) => {

    const sql = `
        SELECT
            orc.id_organization as "organization_id",
            org.created_at as "organization_creation_date",
            ora.description as "organization_name",
            com.id as "company_id",
            com.created_at as "company_creation_date",
            coa.description as "company_name",
            cou.id as "countryside_id",
            cou.created_at as "countryside_creation_date",
            csa.description as "countryside_name",
            cs1.description as "countryside_latitude",
            cs2.description as "countryside_longitude",
            lot.id as "lot_id",
            lot.created_at as "lot_creation_date",
            loa.description as "lot_name"
        from organizations org
            join organization_companies orc on orc.id_organization = org.id
            join companies com on com.id = orc.id_company
            join company_countrysides cco on cco.id_company = com.id
            join countrysides cou on cou.id = cco.id_countryside
            join countryside_lots csl on csl.id_countryside = cou.id
            join lots lot on lot.id = csl.id_lot
            -- Attributes
            join lot_attributes loa on loa.id_lot = lot.id and loa.id_attribute = 1
            join countryside_attributes csa on csa.id_countryside = cou.id and csa.id_attribute = 1
            join countryside_attributes cs1 on cs1.id_countryside = cou.id and cs1.id_attribute = 12
            join countryside_attributes cs2 on cs2.id_countryside = cou.id and cs2.id_attribute = 13
            join company_attributes coa on coa.id_company = com.id and coa.id_attribute = 1
            join organization_attributes ora on ora.id_organization = org.id and ora.id_attribute = 1
        where 1 = 1
        and org.id = :org_id
        and orc.active = 1
        and com.active = 1
        and org.active = 1
        and cco.active = 1
        and cou.active = 1`;

    return await db.sql(
        sql,
        organization_id
    );

};

module.exports = { organization_devices, organization_silobags, organization_lots };

