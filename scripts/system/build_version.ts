import cache from "../../source/core/cache";

(async () => {
    await cache.connect("none");
    await cache.set("ZOMBI_BUILD_VERSION", new Date().toISOString());
    await cache.disconnect();
})();