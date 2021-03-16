import { loopback } from ".";

describe("CLIENT Tests", () => {

    it("Responds with error on bad url", async () => {
        const response_data = await loopback({
            data: {
                mod: "system/tests",
                fun: "ping",
                args: "non_relevant"
            },
            url: "http://127.0.0.1:65000/server",
            request_id: "test"
        });

        
        expect(response_data.error).toEqual(true);
        expect(response_data.code).toEqual(500);
        expect(response_data.message).toEqual(expect.any(String));
        expect(response_data.message).toEqual("Client request error: connect ECONNREFUSED 127.0.0.1:65000");

    });

    it("Responds with 'pong' from test module", async () => {
        const response_data = await loopback({
            data: {
                mod: "system/tests",
                fun: "ping",
                args: "non_relevant"
            },
            request_id: "test"
        });

        expect(response_data.error).toEqual(false);
        expect(response_data.code).toEqual(200);
        expect(response_data.message).toEqual(expect.any(String));
        expect(response_data.message).toEqual("pong");

    });


});
