const db = require("../../../../core/db");

const { is_superadmin } = require("../../logic/common");

const alerts_user_data = async (user_id, org_id, historical = false) => {

    const sql = `select
					UNIX_TIMESTAMP(alr.measurement_created_at) as "alert_creation_date",
					alr.amount_1 as "alert_amount_1",
					alr.amount_2 as "alert_amount_2",
					alr.amount_3 as "alert_amount_3",
					alr.id_metric as "alert_metric_id",
					met.shortname as "alert_metric",
					alt.description  as "alert_color",
					sil.id as "silobag_id",
					sba.description as "silobag_name",
					alr.id_device as "device_id",
					alr.id_company as "company_id",
					alr.id_organization as "organization_id",
					dea.description as "device_name",
					cnt.description as "countryside_name",
					loa.id_lot as "lot_id",
					loa.description as "lot_name",
					alr.id as "alert_id",
					alr.id_alert_status as "alert_status_id",
					als.description as "alert_status",
					alr.created_at as "alert_creation_date2",
					de3.description as "device_order"
				from device_alerts alr
				join metrics met on met.id = alr.id_metric
				join alert_statuses als on als.id = alr.id_alert_status
				join alert_types alt on alt.id = alr.id_alert_type
				-- join ignored_alerts ial on ial.id_alert = alr.id
				-- FIXME: revisar este join ya que habían errores en la
				-- en la generación de alertas en el modelo de Steplix
				join silobag_devices sbd on sbd.id_device = alr.id_device
				join silobags sil on sil.id = sbd.id_silobag
				join lot_silobags lsb on lsb.id_silobag = sil.id
				join lots lot on lot.id = lsb.id_lot
				-- Attributes
				join countryside_attributes cnt on cnt.id_countryside = alr.id_countryside and cnt.id_attribute = 1
				join device_attributes dea on dea.id_device = alr.id_device and dea.id_attribute = 1
				-- left join user_attributes usa on usa.id_user = atr.id_user and usa.id_attribute = 1
				join silobag_attributes sba on sba.id_silobag = sil.id and sba.id_attribute = 1
				join lot_attributes loa on loa.id_lot = lot.id and loa.id_attribute = 1
				join device_attributes de3 on de3.id_device = sbd.id_device and de3.id_attribute = 10
				where 1 = 1
				and (
            lower(dea.description) like concat('%', concat(lower(:search), '%')) or
            lower(met.shortname) like concat('%', concat(lower(:search), '%')) or
            lower(alr.amount_1) like concat('%', concat(lower(:search), '%')) or
            lower(cnt.description) like concat('%', concat(lower(:search), '%')) or
            lower(loa.description) like concat('%', concat(lower(:search), '%')) 
            )
				and alr.id_organization = :org_id
				-- and alr.id_alert_status ${historical ? "" : "not"} in (3, 7)
				-- order by alr.measurement_created_at desc
				`; //          3 solved, 7 deleted


    return sql;

};

const device_last_metric = async (device_id, metric_id, unit_id = 1) => {

    let sql, bind;

    if (metric_id == 12) { // HEG

        sql = `SELECT
					UNIX_TIMESTAMP(measurement_created_at) as "created_at_timestamp",
					heg as "amount",
					hint,
					tint
				from measurements_heg
					where id_device = :device_id
					ORDER BY measurement_created_at desc
				LIMIT 1`;

        bind = [device_id];

    } else if (metric_id == 24) {
        return null;
    } else {

        sql = `SELECT
					UNIX_TIMESTAMP(created_at) as "created_at_timestamp",
					amount
				from measurements
					where id_device = :device_id
					and id_metric = :metric_id
					and id_unit = :unit_id
					ORDER BY created_at desc
				LIMIT 1`;

        bind = [device_id, metric_id, unit_id];

    }

    const data = await db.sqlr(sql, bind);

    return Object.values(data);

};

const alert_transactions_count = async (id_alert) => {
    const database_name = "default";

    return db.sqlv("select count(*) from alert_transactions where id_alert = :id_alert", id_alert, database_name);
};

module.exports = {
    alerts_user_data,
    device_last_metric,
    alert_transactions_count
};
