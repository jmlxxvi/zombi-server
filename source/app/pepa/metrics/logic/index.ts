import ampNode from "@amplitude/node";
import log from "../../../../core/log";

// TODO the typing on this file is missing a lot of types. Check all any types

/**
 * This function return an instance of amplitude.
 * @param key  - request key.
 * @param request_id  - request context.
 * @returns Amplitude object
 * */
export const amplitudeConnection = async (key: string, request_id: string) => {
    try{
        /**
         * @type {object}
         * @property {string} status - message explaining what the api return .
         * @property {number} statusCode - number that explain the type of error.
         * @property {Object=} body - the object result.
         */
        return ampNode.init(key);
    }catch(error){
        log.error(error, "pepa/metrics/logic/handle_events", request_id);
        return error.message;
    }
};
/**
 * Here we obtain an instance of amplitude, set the key and
 * send the event to the platform.
 * @param {object} object  - request object.
 * @param {object} request_id  - request context.
 * @returns Promise {object}
 * @example
 * Returned Data:
    {
        "error": false,
        "code": 200,
        "message": "ok",
        "data": {
            "status": "success",
            "statusCode": 200,
            "body": {
                "eventsIngested": 2,
                "payloadSizeBytes": 891,
                "serverUploadTime": 1612206589128
            }
        },
        "elapsed": 1271,
        "request_id": "e559a9ea-3d86-4d86-91cf-c92af620f953"
    } 
 **/


export const handle_metrics_events = async (object: any, request_id: string) => {
    try{
        const key = process.env.APP_AMPLITUDE_KEY_PROJECT || "";
        //Instance the amplitude client
        const client = await amplitudeConnection(key, request_id);
        //Verify that the body is an object, if not, I format it to json
        const events = (typeof object === "object" ) ? object : JSON.parse(object);

        //Generate the format corresponding to an amplitude event
        const params = parseBody(events);

        params.forEach(item => {
            client.logEvent(item);
            log.debug("Event type " + item.event_type + "User id " + item.user_id, "pepa/metrics/logic/handle_events", request_id);
        });
        /**
         * @type {object}
         * @property {string} status - message explaining what the api return .
         * @property {number} statusCode - number that explain the type of error.
         * @property {Object=} body - the object result.
         */
        const result = await client.flush();
        log.debug(result.status, "pepa/metrics/logic/handle_events/result", request_id);
    
        if(result.statusCode != 200){
            throw new Error(result.body.error || "Ocurrió un error inesperado.");
        }
        return result;
    } catch (error) {

        log.error(error, "pepa/metrics/logic/handle_events", request_id);
       
        return error.message;

    }
};

/**
 * Generate a usable format within amplitude.
 * @param {object} body  - request body.
 */
const parseBody = (body: any) => {
    const eventsParser: any[] = [];
    const property = {
        user_id: body.userId || "undefined@personalpay.com",
        device: body.device || "",
        device_id: body.deviceId || "undefined_id",
        platform:body.platform || "",
        appVersion:body.appVersion || "",
        region: body.region || "Buenos Aires",
        os_name: body.os_name || "",
        os_version: body.os_version || ""

    };
        
    const { events, userId } = body;

    events.forEach((item: any) => {
        eventsParser.push(
            {
                event_type: item.name,
                user_id: userId || "undefined@personalpay.com",
                event_properties: item.payload ? 
                    {...property, ...item.payload, time: item.time }
                    : {...property, time: item.time}
            }
        );
    });

    return eventsParser;
};

export default {
    amplitudeConnection,
    handle_metrics_events
};