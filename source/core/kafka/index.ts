import log from "../log";

import { Kafka } from "kafkajs";

import fs from "fs";

let connected = false;
let producer: any = null;

const brokers = process.env.APP_EVENTS_KAFKA_BROKERS || "";

/**
 * Connects to the Kafka broker(s) on first send() call.
 * @param {string=} request_id - The transaction request ID
 * @returns Promise{void}
 */
const _connect = async (request_id: string) => {

    if (!connected) {

        const kafka = new Kafka({
            brokers: brokers.split(","),
            ssl: {
                rejectUnauthorized: false,
                ca: [fs.readFileSync(__dirname + "/certs/ca.crt", "utf-8")],
                key: fs.readFileSync(__dirname + "/certs/key.pem", "utf-8"),
                cert: fs.readFileSync(__dirname + "/certs/cert.pem", "utf-8"),
                passphrase: process.env.APP_EVENTS_KAFKA_PASSPHRASE
            },
        });

        producer = kafka.producer();

        await producer.connect();

        log.debug(`Conected to Kafka brokers ${brokers}`, "kafka/connect", request_id);

        connected = true;
    }
};



/**
 * Sends a message string or array of strings to the topic indicated to Kafka brokers
 * @param params
 * @param params.topic - The topic to send the message(s) to 
 * @param params.messages - The message(s) to send
 * @param params.request_id - The request ID to use with log()
 */
const send = async ({ topic, messages, request_id }: { topic: string, messages: string[] | string, request_id: string }) => {

    const mess = Array.isArray(messages) ? messages.map(message => ({ value: message })) : [{ value: messages }];

    await _connect(request_id);

    await producer.send({
        topic: topic,
        messages: mess
    });

};

/**
 * Disconnects from Kafka brokers
 * @param request_id - The transaction request ID
 */
const disconnect = async (request_id: string) => {

    log.debug(`Disconnected from Kafka brokers ${brokers}`, "kafka/disconnect", request_id);

    return producer.disconnect();

};

module.exports = {
    send,
    disconnect
};