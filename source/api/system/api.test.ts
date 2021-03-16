import config from "../../core/config";
import { http } from "../../core/client";

const url = config.client.endpoint;

let token = "";

const params = (args: any) => {

    const smarap: any = {};

    if (token !== "") { smarap.token = token; }
    if (args[0]) { smarap.mod = args[0]; }
    if (args[1]) { smarap.fun = args[1]; }
    if (args[2]) { smarap.args = args[2]; }

    return smarap;

};



describe("API Tests", () => {

    it("Responds with invalid schema error ", async done => {

        const res = await http({
            url, 
            data: {}
        });

        expect(res.data.error).toBeTruthy();
        expect(res.data.code).toEqual(500);
        expect(res.data.message).toEqual("JSON schema validation error: data should have required property 'mod'");

        done();
    });


    it("Responds with an encripted password", async done => {

        const res = await http({
            url, 
            data: params([
                "system/public",
                "hash",
                "not_relevant"
            ])
        });

        expect(res.data.error).toEqual(false);
        expect(res.data.code).toEqual(200);
        expect(res.data.message).toEqual(expect.any(String));
        expect(res.data.data.length).toEqual(60);
        expect(res.data.data.substring(0, 1)).toEqual("$");

        done();

    });

    it("Responds with 'Unable to login' and code 1004 - bad user", async done => {

        const res = await http({
            url, 
            data: params([
                "system/public",
                "login",
                { username: "non_existing_users", password: "wrongpassword" }
            ])
        });

        expect(res.data.error).toEqual(true);
        expect(res.data.code).toEqual(1004);
        expect(res.data.message).toEqual(expect.any(String));

        expect(res.data.message).toEqual("Unable to login");

        done();

    });

    it("Responds with 'Unable to login' and code 1004 - bad password", async done => {

        const res = await http({
            url, 
            data: params([
                "system/public",
                "login",
                { username: "system", password: "wrongpassword" }
            ])
        });

        expect(res.data.error).toEqual(true);
        expect(res.data.code).toEqual(1004);
        expect(res.data.message).toEqual(expect.any(String));

        expect(res.data.message).toEqual("Unable to login");

        done();

    });

    it("Executes API with auth header credentials", async done => {

        const res = await http({
            url, 
            data: params([
                "system/tests",
                "ping"
            ]),
            headers: { [config.security.auth_header_key]: config.security.auth_header_value }
        });

        expect(res.data.error).toEqual(false);
        expect(res.data.code).toEqual(200);
        expect(res.data.message).toEqual(expect.any(String));
        expect(res.data.message).toEqual("pong");

        done();

    });

    it("Returns error on invalid language", async done => {

        const res = await http({
            url, 
            data: params([
                "system/public",
                "login",
                {
                    username: process.env.ZOMBI_TEST_USER_NAME,
                    password: process.env.ZOMBI_TEST_USER_PASSWORD,
                    language: "XX"
                }
            ])
        });

        expect(res.data.error).toEqual(true);
        expect(res.data.code).toEqual(1005);
        expect(res.data.message).toEqual(expect.any(String));
        expect(res.data.message).toEqual("Invalid language: XX");

        done();

    });

    it("Logs in with test user and returns token", async done => {

        const res = await http({
            url, 
            data: params([
                "system/public",
                "login",
                {
                    username: process.env.ZOMBI_TEST_USER_NAME,
                    password: process.env.ZOMBI_TEST_USER_PASSWORD
                }
            ])
        });

        expect(res.data.error).toEqual(false);
        expect(res.data.code).toEqual(200);
        expect(res.data.message).toEqual(expect.any(String));
        expect(res.data.message).toEqual("ok");
        expect(res.data.data.token.length).toEqual(config.security.token_size * 2);

        token = res.data.data.token;

        done();

    });

    it("Returns 'Function not found' from tests module", async done => {

        const res = await http({
            url, 
            data: params([
                "system/tests",
                "invalid_function_name"
            ])
        });

        expect(res.data.error).toEqual(true);
        expect(res.data.code).toEqual(1003);
        expect(res.data.message).toEqual(expect.any(String));

        expect(res.data.message).toEqual("Cannot execute system/tests:invalid_function_name");

        done();

    });

    it("Returns 'pong' from tests module", async done => {

        const res = await http({
            url, 
            data: params([
                "system/tests",
                "ping"
            ])
        });

        expect(res.data.error).toEqual(false);
        expect(res.data.code).toEqual(200);
        expect(res.data.message).toEqual(expect.any(String));

        expect(res.data.message).toEqual("pong");

        done();

    });

    it("Returns error by calling a hidden module because it starts with underscore", async done => {

        const res = await http({
            url, 
            data: params([
                "system/hidden",
                "call"
            ])
        });

        expect(res.data.error).toEqual(true);
        expect(res.data.code).toEqual(1003);
        expect(res.data.message).toEqual(expect.any(String));
        expect(res.data.message).toEqual("Cannot execute system/hidden:call");

        done();

    });

    it("Returns error by calling a hidden function because it starts with underscore", async done => {

        const res = await http({
            url, 
            data: params([
                "system/tests",
                "_hidden"
            ])
        });

        expect(res.data.error).toEqual(true);
        expect(res.data.code).toEqual(1003);
        expect(res.data.message).toEqual(expect.any(String));
        expect(res.data.message).toEqual("Cannot execute system/tests:_hidden");

        done();

    });

    it("Returns response from echo test function", async done => {

        const res = await http({
            url, 
            data: params([
                "system/tests",
                "echo",
                "eco,eco,eco"
            ])
        });

        expect(res.data.error).toEqual(false);
        expect(res.data.code).toEqual(200);
        expect(res.data.data).toEqual(expect.any(String));
        expect(res.data.data).toEqual("eco,eco,eco");

        done();

    });

    it("Ends session", async done => {

        const res = await http({
            url, 
            data: params([
                "system/public",
                "logoff"
            ])
        });

        expect(res.data.error).toEqual(false);
        expect(res.data.code).toEqual(200);

        done();

    });

    it("Returns code 1001 after logoff", async done => {

        const res = await http({
            url, 
            data: params([
                "system/tests",
                "ping"
            ])
        });

        expect(res.data.error).toEqual(true);
        expect(res.data.code).toEqual(1001);
        expect(res.data.message).toEqual(expect.any(String));
        expect(res.data.message).toEqual("Invalid token/Session expired");

        done();

    });

    it("Returns code 1001 after token cleared", async done => {

        token = "";

        const res = await http({
            url, 
            data: params([
                "system/tests",
                "ping"
            ])
        });

        expect(res.data.error).toEqual(true);
        expect(res.data.code).toEqual(1001);
        expect(res.data.message).toEqual(expect.any(String));
        expect(res.data.message).toEqual("Invalid token/Session expired");

        done();

    });

});

