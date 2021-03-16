"use strict";

const {
    handle_metrics_events,
    amplitudeConnection
} = require("../../logic");
const args = {
    "userId": "12444342342342423ddddd4444",
    "deviceId": "3333333333212321321",
    "device": "Api",
    "region": "Buenos Aires",
    "appVersion": "0.1.0",
    "os_name": "MacBook Pro",
    "os_version": "Catalina 10.5.6",
    "events": [
        {
            "name": "test_dev_dami",
            "time": "2021-01-19 15:02:43",
            "payload": {
                "path": "event/test",
                "page": "test"
            }
        },
        {
            "name": "test-hello_dami",
            "time": "2021-01-19 15:02:43",
            "payload": {
                "path": "event/test",
                "page": "test"
            }
        }
    ]
};
const request_id = "7d91b1aa-0515-4052-845d-dfdd7ea635ce"

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

describe("Pepa metrics", () => {

    it("amplitude success response", async () => {
    
        const result = await handle_metrics_events(args,request_id);
        if(typeof(result)!='string'){
            expect(result).to.be.an('object');
            expect(result.body).to.be.an('object');
            expect(result.statusCode).equal(200);
            assert(result.status);
            assert(result.body);
            assert(result.statusCode);
        }
            
    });
    it("amplitude connection error",async () => {
        // const connection = await amplitudeConnection("ffff",request_id);
        // const result = await connection.flush();
        // expect(result.statusCode).to.not.equal(200);
     });
});
