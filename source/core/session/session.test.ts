import session from ".";
import { timestamp, uuid } from "../utils";

import cache from "../cache";

const token_key = "TOKEN_ENTRY_90345784633463";

const test_user_id = uuid();

describe("SESSION Tests", () => {

    it("Responds with error on invalid token to create a session", async () => {
        try {

            await cache.connect("test");

            await session.create({ token: "", data: {}, request_id: "test" });

            fail("Should have thrown");
        } catch (error) {
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("Cannot create session with an invalid token");
        }
    });

    it("Creates a session and returns the timestamp", async () => {
        const ts = timestamp();
        const session_timestamp = await session.create({ token: token_key, data: { user_id: test_user_id }, request_id: "test" });

        expect(session_timestamp).toEqual(expect.any(Number));
        expect(session_timestamp).toBeLessThanOrEqual(ts);
    });

    it("Sets session data appending to the previously created one", async () => {
        const session_data = await session.set(token_key, "another_entry", "more_data");

        expect(session_data).toEqual(expect.any(Number));
        expect(session_data).toEqual(1);
    });

    it("Gets session data and checks its contents", async () => {
        let session_data = await session.get(token_key, "user_id");

        expect(session_data).toEqual(expect.any(String));
        expect(session_data).toEqual(test_user_id);

        session_data = await session.get(token_key, "another_entry");

        expect(session_data).toEqual(expect.any(String));
        expect(session_data).toEqual("more_data");
    });

    it("Gets user ID from session data", async () => {
        const session_data = await session.user_id(token_key);

        expect(session_data).toEqual(expect.any(String));
        expect(session_data).toEqual(test_user_id);
    });

    it("Gets tokens for the previously created user", async () => {
        const session_data = await session.tokens(test_user_id);

        expect(session_data).toEqual(expect.any(Array));
        expect(session_data).toHaveLength(1);

        expect(session_data[0]).toEqual(expect.any(String));
        expect(session_data[0]).toEqual(token_key);
    });

    it("Returns false on check session with invalid token", async () => {
        const session_data = await session.check("bad_token");

        expect(session_data).toEqual(expect.any(Boolean));
        expect(session_data).toBeFalsy();
    });

    it("Returns true on check session with valid token", async () => {
        const session_data = await session.check(token_key);

        expect(session_data).toEqual(expect.any(Boolean));
        expect(session_data).toBeTruthy();
    });

    it("Get error on updating session with invalid token", async () => {
        const session_data = await session.update({ token: "bad_token", request_id: "test" });

        expect(session_data).toEqual(0);
    });

    it("Check the session was destroyed for the previously created user", async () => {

        await session.destroy({ token: token_key, send_sockets: false, request_id: "test" });

        const session_data = await session.tokens(test_user_id);

        expect(session_data).toEqual(expect.any(Array));
        expect(session_data).toHaveLength(0);
    });

    it("Recreates a session and returns the timestamp", async () => {
        const ts = timestamp();
        const session_timestamp = await session.create({ token: token_key, data: { user_id: test_user_id }, request_id: "test" });

        expect(session_timestamp).toEqual(expect.any(Number));
        expect(session_timestamp).toBeLessThanOrEqual(ts);
    });

    it("Rechecks session returns user ID", async () => {
        const session_data = await session.get(token_key, "user_id");

        expect(session_data).toEqual(expect.any(String));
        expect(session_data).toEqual(test_user_id.toString());

    });

    it("Expires all sessions and checks session is gone", async () => {
        await session.expire({ period: 0, send_sockets: false, request_id: "test" });

        const session_data = await session.get(token_key, "user_id");

        expect(session_data).toBeNull();
    });

});

afterAll(async (done) => {
    await cache.disconnect();
    done();
});