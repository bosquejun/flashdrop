-- KEYS[1]: product:{SKU}:stock
-- KEYS[2]: product:{SKU}:buyers
-- ARGV[1]: user_id
-- ARGV[2]: quantity_to_refund

local stock_key = KEYS[1]
local buyer_key = KEYS[2]
local user_id   = ARGV[1]
local refund_qty = tonumber(ARGV[2])

-- 1. Restore the stock
local current_stock = redis.call("INCRBY", stock_key, refund_qty)

-- 2. Reduce the user's purchase count in the hash
local bought = tonumber(redis.call("HGET", buyer_key, user_id) or 0)
local new_bought = bought - refund_qty

if new_bought <= 0 then
    -- If they have no more items left, just remove the field to save memory
    redis.call("HDEL", buyer_key, user_id)
else
    redis.call("HSET", buyer_key, user_id, new_bought)
end

return current_stock -- Return updated stock for logging
