import cache from ".";

const cache_key = "TESTING_ENTRY_90345784633463";


describe("CACHE Tests", () => {

    it("Responds with error on disconnected cache", async () => {

        try {

            await cache.set(cache_key, "123456789");

        } catch (error) {

            expect(error.message).toBe("Calling cache function when server is not ready");

        }

    });

    it("Responds with 'OK' on valid set", async () => {

        await cache.connect("test");

        const response = await cache.set(cache_key, "123456789");

        expect(response).toMatch("OK");
    });

    it("Gets created value from cache", async () => {
        const response = await cache.get(cache_key);

        expect(response).toEqual(expect.any(String));
        expect(response).toMatch("123456789");
    });

    it("Deletes value from cache", async () => {
        const response = await cache.del(cache_key);

        expect(response).toEqual(expect.any(Number));
        expect(response).toEqual(1);
    });

    it("Gets empty value from cache after delete", async () => {
        const response = await cache.get(cache_key);

        expect(response).toBeNull();
    });

});

afterAll(async (done) => {
    await cache.disconnect();
    done();
});
