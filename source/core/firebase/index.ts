import config from "../config";
import session from "../session";
import { http } from "../client";

// "fKUYzKg5S92157MemPJ4Vo:APA91bFJ06faUSFVCFxzg16JkBYyZoctBlyLObnan7hyfsBs2b1JkYPaBuVQarVe1WWVtt4U9WzjJRuJnch2vHoHnDQ3dGKGfGsiqKOVhmMC4-mukrwMZ-lxJClLJCoSER6mw3egHHQP"

type ZombiFirebaseNotificationMessagePayload = {
    to: string,
    data: {
        notification_title: string,
        notification_text: string,
        data_title: string,
        data_text: string,
        extra: {
            order: number,
            text: string,
            partial: string
        },
        extra2: string
    }
};

// TODO define type for payload
const send_push_notification = async (payload: ZombiFirebaseNotificationMessagePayload) => {

    const response = await http({
        url: config.firebase.messaging.url,
        data: payload,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `key=${config.firebase.messaging.server_key}`
        }
    });

    return response.data;

};

// TODO define type for data
const send_message_to_token = async (token: string, data: string) => { // eslint-disable-line

    const firebase_id = await session.get(token, "push_notifications_token");

    if (firebase_id) {

        // This is the secret of cloud messaging… — 
        // “When the payload of the message does not contain notification parameter, 
        // everything is captured by the onMessageReceived() method in all application states”
        //
        // To create a notification on the mobile app send both notification_title and notification_text data parameters
        // If you omit them, only the data is sent to the app
        const payload = {
            "to": firebase_id,
            "data" : {
                "notification_title": "Test data title",
                "notification_text": "Test data Text",
                "data_title": "Test data title2",
                "data_text": "Test data Text2",
                "extra": {
                    order: 1999,
                    text: "none",
                    partial: "xx",
                    data
                },
                extra2: "잘못된 사용자 이름 또는 비밀번호"
            }
        };
    
        const response = await send_push_notification(payload);
    
        return response;

    } else { return null; }

};

module.exports = {
    send_message_to_token
};