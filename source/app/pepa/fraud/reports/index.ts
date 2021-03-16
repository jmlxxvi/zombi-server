import aws from "../../../../core/aws";
import log from "../../../../core/log";

import { clients_onboarding_db } from "./db";

import { http } from "../../../../core/client";
import { getCountryName } from "./data/countries";
import { normalizeProvince } from "./utils/DataParser";
/**
 * Creates a CSV report of the users onboarded to the app and sends it via Slack
 * @param request_id The transaction request ID for logging
 * @param send_to_slack Flag to indicate if the results are sent to Slack. Used to prevent testing from sending the data.
 */
export const clients_onboarding = async (request_id: string, send_to_slack = false) => {

    try {

        if (process.env.APP_FRAUD_REPORTS_ENABLED === "true") {

            const data = await clients_onboarding_db();

            log.debug(`${data.length} rows returned`, "fraud/reports:clients_onboarding", request_id);
            const rows = [];
        
            let client;
        
            for (const row of data) {
         
                const phone = JSON.parse(row.phone);
                const legal = JSON.parse(row.legal);
                const document = JSON.parse(row.document);
                const address = JSON.parse(row.address);
                const match = JSON.parse(row.match);
                const reason = JSON.parse(row.reason);

                client = {
                    fecha_alta: row.creationdate ? row.creationdate : "-",
                    numero_documento: !!document && document.number ? document.number : "-",
                    numero_cuil: row.cuil ? row.cuil : "-",
                    email: row.email ? row.email : "-",
                    nombre: !!document && document.firstName ? document.firstName + " " + document.lastName : "-",
                    fecha_nacimiento: !!document && document.birthdate ? document.birthdate : "-",
                    genero: !!document && document.gender ? document.gender : "-",
                    nacionalidad:       !!document && document.nationality ? getCountryName(document.nationality) : "-",
                    numero_telefonico: phone ? (phone.number).toString() : "-",
                    nombre_calle: !!address && address.streetName ? address.streetName : "-",
                    numero_calle: !!address && address.streetNumber ? address.streetNumber : "-",
                    piso: !!address && address.floor ? address.floor : "-",
                    codigo_postal: !!address && address.postalCode ? address.postalCode : "-",
                    ciudad: !!address && address.city ? address.city : "-",
                    provincia: !!address && address.province ? normalizeProvince(address.province) : "-",
                    pais_direccion: !!address && address.country ? address.country : "-",
                    geo_latitud: !!address && address.geoLocation.geoCoordinates.latitude ? address.geoLocation.geoCoordinates.latitude : "-",
                    geo_longitud: !!address && address.geoLocation.geoCoordinates.longitude ? address.geoLocation.geoCoordinates.longitude : "-",
                    ddj_legal_so: legal ? (legal.so).toString() : "-",
                    ddj_legal_fatca: legal ? (legal.fatca).toString() : "-",
                    ddj_legal_pep: legal ? (legal.pep).toString() : "-",
                    ocupacion: row.occupation ? row.occupation : "-",
                    ip_conexion: row.ipaddress ? row.ipaddress : "-",
                    resultado_jumio: row.status ? row.status : "-",
                    fecha_onboarding: row.onboarding_date ? row.onboarding_date : "-",
                    horario_onboarding: row.onboarding_hour ? row.onboarding_hour : "-",                    
                    motivo_rechazo: !!reason && reason.message ? reason.message : "-",
                    porc_match: (!!match && match.matchScore) ? match.matchScore : "-",
                   
                };
        
                rows.push(client);
        
            }
        
            const headers = client ? Object.keys(client) : [];
        
            const lines = rows.map(e => Object.values(e).map(x => x ? typeof x === "number" ? x : `"${x}"` : "").join(",")).join("\r\n");
        
            const csv_data = headers + ",\r\n" + lines;
        
            const date = new Date,
                dateformat = date.getDate() + "-" +
                    (date.getMonth() + 1) + "-" +
                    date.getFullYear() +
            "-" +
                       date.getHours();
            const csv_name = `Fraud_clients-${dateformat}.csv`;

        
            const params = {
                Bucket: process.env.APP_FRAUD_BUCKET_NAME || "none",
                Key: csv_name,
                Body: csv_data,
            };
        
            await aws.s3().upload(params).promise();
            const signed_url = await aws.s3().getSignedUrl(
                "getObject",
                {
                    Bucket: process.env.APP_FRAUD_BUCKET_NAME,
                    Key: csv_name,
                    Expires: parseInt(process.env.APP_FRAUD_LINK_TIMEOUT || "100000") // TODO check if this default value is correct
                }
            );
    
            log.debug(`Signed URL is ${signed_url}`, "fraud/reports:clients_onboarding", request_id);
        
            if (send_to_slack && process.env.NODE_ENV !== "Prod") {
    
                const url = `https://hooks.slack.com/services/${process.env.APP_FRAUD_SLACK_TOKEN}`;
    
                log.debug(`Slack URL is ${url}`, "fraud/reports:clients_onboarding", request_id);
            
                const body = {
                    "attachments": [
                        {
                            "color": "#36a64f",
                            "pretext": "Se ha generado un archivo con la información de los clientes registrados en Personal Pay",
                            "title": "Listado de clientes de Personal Pay",
                            "title_link": signed_url,
                            "text": "Recuerde que tiene un período de validez predeterminado",
                            "author_name": "Prevención de Fraudes",
                            "author_icon": "https://blog.personal.com.py/wp-content/uploads/2020/03/delito-informatico.jpg",
                            "fields": [
                                {
                                    "title": "Tiempo de expiración",
                                    "value": "1 semana",
                                    "short": false
                                },
                                {
                                    "title": "Entorno",
                                    "value": process.env.NODE_ENV,
                                    "short": false
                                }
                            ]
                        }
                    ]
                };
            
                await http({
                    url, 
                    data: body, 
                    headers: {
                        "Accept": "application/x-www-form-urlencoded, application/json",
                        "Content-Type": "application/json",
                    }
                });
    
            }
        
            return signed_url;

        } else {

            log.debug("Reports disabled", "fraud/reports:clients_onboarding", request_id);

            return "Reports disabled";

        }
        
    } catch (error) {
        log.error(error, "pepa/fraud/reports", request_id);

        return error.message;
    }
};

