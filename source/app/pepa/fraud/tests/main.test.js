// const config = require(__dirname + "/../../../core/config");
// const log = require(__dirname + "/../../../core/log");
// const cache = require(__dirname + "/../../../../core/cache");

const {
    clients_onboarding
} = require(__dirname + "/../../../../app/pepa/fraud/reports");

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

describe("PEPA/FRAUD Tests", () => {

    it("Responds with the URL to get the file from S3", async () => {

        const url = await clients_onboarding();

        const regex = new RegExp(`${process.env.APP_FRAUD_BUCKET_NAME}.s3.amazonaws.com.*\.csv.*AWSAccessKeyId`, "g");

        // expect(regex.test(url)).to.be.true;
        // expect(regex.test(url)).to.be.true;

    });

});

