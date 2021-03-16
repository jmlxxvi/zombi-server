local c = tonumber(redis.call("get", KEYS[1]))
if c then
    if tonumber(ARGV[1]) > c then
        redis.call("set", KEYS[1], ARGV[1])
        return tonumber(ARGV[1]) - c
    else
        return 0
    end
else
    return redis.call("set", KEYS[1], ARGV[1])
end
