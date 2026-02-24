--[[
  create-order.lua — Atomic flash-sale order reservation

  Reserves inventory for a single user order by decrementing product stock and
  recording the purchase in the buyers hash. Runs atomically in Redis so
  concurrent requests cannot oversell or violate per-user limits.

  KEYS:
    [1] stock_key   — String key holding available quantity of the product (e.g. product:{SKU}:stock)
    [2] buyer_key   — Hash key of user_id -> quantity bought (e.g. product:{SKU}:buyers)

  ARGV:
    [1] user_id     — Identifier for the buyer (string)
    [2] buy_qty     — Quantity to reserve (number, as string)
    [3] user_limit  — Max quantity this user may purchase for this product (number, as string)

  RETURNS:
    -2              — Out of stock (current stock < buy_qty)
    -1              — Per-user limit exceeded (bought + buy_qty > user_limit)
    new_stock (≥0)  — Success; remaining stock after decrement (caller treats 0 or positive as success)
]]

local stock_key = KEYS[1]
local buyer_key = KEYS[2]
local user_id   = ARGV[1]
local buy_qty   = tonumber(ARGV[2])
local limit     = tonumber(ARGV[3])

-- Read current state (minimal round-trips; script is single-threaded per key)
local stock = tonumber(redis.call("GET", stock_key) or 0)
local bought = tonumber(redis.call("HGET", buyer_key, user_id) or 0)

-- Reject if not enough inventory
if stock < buy_qty then
    return -2 -- Out of stock
end

-- Reject if this user would exceed their purchase limit
if (bought + buy_qty) > limit then
    return -1 -- Limit exceeded
end

-- Reserve stock and record buyer (atomic)
local new_stock = redis.call("DECRBY", stock_key, buy_qty)
redis.call("HINCRBY", buyer_key, user_id, buy_qty)

-- Return the new stock after the decrement
return new_stock
