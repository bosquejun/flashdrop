-- KEYS[1]: product:{SKU}:stock
-- KEYS[2]: product:{SKU}:buyers
-- ARGV[1]: user_id
-- ARGV[2]: buy_qty
-- ARGV[3]: user_limit

-- Return Values:
-- -2: Out of Stock
-- -1: Limit Exceeded
-- 0: Success (Can purchase)

local stock_key = KEYS[1]
local buyer_key = KEYS[2]
local user_id   = ARGV[1]
local buy_qty   = tonumber(ARGV[2])
local limit     = tonumber(ARGV[3])

-- 1. Get stock & user purchase count in one go (reduce internal ops)
local stock = tonumber(redis.call("GET", stock_key) or 0)
local bought = tonumber(redis.call("HGET", buyer_key, user_id) or 0)

-- 2. Validate
if stock < buy_qty then 
    return -2 -- Out of Stock
end

if (bought + buy_qty) > limit then
    return -1 -- Limit Exceeded
end

-- 3. Execute Atomic Update
local new_stock = redis.call("DECRBY", stock_key, buy_qty)
redis.call("HINCRBY", buyer_key, user_id, buy_qty)

return new_stock 
