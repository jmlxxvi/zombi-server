const db = require("../../../../core/db");

const silobag_devices = async (silobag_id) => {

    const sql = `
		select
			sil.id as "silobag_id",
			sil.created_at as "silobag_creation_date",
			sb3.description as "silobag_confection_date",
			sb4.description as "silobag_extraction_date",
			sba.description as "silobag_name",
			sbt.description as "silobag_type",
			sbh.description as "harvest",
			sbp.description as "production",
			sb2.description as "meters",
			dev.id as "device_id",
			de2.description as "device_name",
			dev.created_at as "device_creation_date",
			det.description as "device_type",
			det.id as "device_type_id",
			dea.description as "device_uuid",
			des.description as "device_status",
			des.id as "device_status_id",
			de3.description as "device_order",
			de4.description as "device_version",
			de5.description as "device_serial"
		from silobags sil
			left join silobag_types sbt on sbt.id = sil.id_silobag_type
			left join silobag_particles sbp on sbp.id = sil.id_silobag_particle
			left join silobag_harvests sbh on sbh.id = sil.id_silobag_harvest
			left join silobag_devices sbd on sbd.id_silobag = sil.id
			left join devices dev on dev.id = sbd.id_device
			left join device_statuses des on des.id = dev.id_device_status
			left join device_types det on det.id = dev.id_device_type
			-- Attributes
			left join silobag_attributes sba on sba.id_silobag = sil.id and sba.id_attribute = 1
			left join silobag_attributes sb2 on sb2.id_silobag = sil.id and sb2.id_attribute = 25 -- size
			left join silobag_attributes sb3 on sb3.id_silobag = sil.id and sb3.id_attribute = 26 -- confection_date
			left join silobag_attributes sb4 on sb4.id_silobag = sil.id and sb4.id_attribute = 27 -- extraction_date
			left join device_attributes dea on dea.id_device = dev.id and dea.id_attribute = 15
			left join device_attributes de2 on de2.id_device = dev.id and de2.id_attribute = 1
			left join device_attributes de3 on de3.id_device = dev.id and de3.id_attribute = 10
			left join device_attributes de4 on de4.id_device = dev.id and de4.id_attribute = 22
			left join device_attributes de5 on de5.id_device = dev.id and de5.id_attribute = 29
			where 1 = 1
				and sil.id = :silobag_id
			order by de3.description`;

    return db.sql(
        sql,
        silobag_id
    );

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

const device_alert_code = async (amount, metric, unit, device_id) => {

    let alert_code = -1;

    if (metric == 4) { // Batery

        const bat_limits = [21, 30];

        if (amount < bat_limits[0]) {

            return 2;

        } else if (amount >= bat_limits[0] && amount <= bat_limits[1]) {

            return 1;

        } else {

            return 0;

        }

    } else {

        const limits = [{
            id: 1,
            name: "Trigo",
            co2: {
                w_min: 7,
                d_min: 20
            },
            heg: {
                w_min: 13.91,
                d_min: 15.96
            }
        },
        {
            id: 2,
            name: "Soja",
            co2: {
                w_min: 5,
                d_min: 20
            },
            heg: {
                w_min: 13.92,
                d_min: 15.98
            }
        },
        {
            id: 3,
            name: "Girasol",
            co2: {
                w_min: 7,
                d_min: 20
            },
            heg: {
                w_min: 15.75,
                d_min: 15.94
            }
        },
        {
            id: 4,
            name: "Sorgo",
            co2: {
                w_min: 7,
                d_min: 20
            },
            heg: {
                w_min: 13.95,
                d_min: 15.95
            }
        },
        {
            id: 5,
            name: "Arroz",
            co2: {
                w_min: 16,
                d_min: 20
            },
            heg: {
                w_min: 13.94,
                d_min: 15.98
            }
        },
        {
            id: 6,
            name: "Maíz",
            co2: {
                w_min: 10,
                d_min: 20
            },
            heg: {
                w_min: 16,
                d_min: 19
            }
        },
        {
            id: 7,
            name: "Maíz Pisingallo",
            co2: {
                w_min: 10,
                d_min: 20
            },
            heg: {
                w_min: 13.91,
                d_min: 15.92
            }
        },
        {
            id: 8,
            name: "Maíz Dentado",
            co2: {
                w_min: 10,
                d_min: 20
            },
            heg: {
                w_min: 13.92,
                d_min: 15.96
            }
        },
        {
            id: 9,
            name: "Maíz Blanco",
            co2: {
                w_min: 10,
                d_min: 20
            },
            heg: {
                w_min: 13.96,
                d_min: 15.93
            }
        },
        {
            id: 10,
            name: "Maíz Waxy",
            co2: {
                w_min: 10,
                d_min: 20
            },
            heg: {
                w_min: 13.91,
                d_min: 15.95
            }
        },
        {
            id: 11,
            name: "Maíz Espiga",
            co2: {
                w_min: 10,
                d_min: 20
            },
            heg: {
                w_min: 13.91,
                d_min: 15.96
            }
        }];

        const silobag_type = await db.sqlr(
            `SELECT
				sbt.id as "silobag_type_id",
				sba.id as "silobag_id",
				sbt.description as "silobag_contents",
				sbt.reference as "silobag_reference",
				sbt.const_a,
				sbt.const_b,
				sbt.const_c
			FROM silobag_types sbt
				INNER JOIN silobags sba ON sba.id_silobag_type = sbt.id
				INNER JOIN silobag_devices sbd ON sba.id = sbd.id_silobag
			WHERE 1=1
			and sbd.id_device = :device_id`,
            device_id
        );

        // console.log(silobag_type);

        if (silobag_type !== null) {

            const limits_data = limits.find(limit => limit.id === silobag_type.silobag_type_id);

            // console.log(limits_data);

            if (limits_data) {

                let limit_w;
                let limit_d;

                switch (metric) {
                case 3:

                    limit_w = limits_data.co2.w_min;
                    limit_d = limits_data.co2.d_min;

                    break;

                case 12:

                    limit_w = limits_data.heg.w_min;
                    limit_d = limits_data.heg.d_min;

                    break;
                }

                if (amount < limit_w) {

                    alert_code = 0;

                } else if (amount >= limit_w && amount <= limit_d) {

                    alert_code = 1;

                } else {

                    alert_code = 2;

                }

            } else {

                log.error("Limits data not found", config.log.label);

            }

        }

        return alert_code;

    }

};

module.exports = { silobag_devices, device_last_metric, device_alert_code };