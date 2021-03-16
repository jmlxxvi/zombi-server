"use strict";

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const { http } = require("../../../../../core/client");
const client_id="6ac57636-3c54-4c31-9dcd-0fb8d2dabdd2lllllll"
describe("Pepa opPendingTransaction tests", () => {

    it("get clients", async () => {
        if(process.env.APP_MS_CLIENT_URL){
            const url = `${process.env.APP_MS_CLIENT_URL}internal/${client_id}`;
            //Generate request
            const result = await http({method:"get", url, headers: {}, data:{}});
            const { status, data } = result;
            expect(status).equal(200 || 400);
            assert(status);
            assert(data);
        }    
    });

});

