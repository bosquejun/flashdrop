--[[
  rollback-order.lua — Atomic rollback of a reserved order

  Reverts a prior create-order reservation when order completion fails (e.g.
  database insert error). Restores product stock and decrements the user's
  purchase count so inventory and per-user limits stay consistent. Must use
  the same KEYS and user_id/quantity as the original create-order call.

  KEYS:
    [1] stock_key   — String key holding available quantity (e.g. product:{SKU}:stock)
    [2] buyer_key   — Hash key of user_id -> quantity bought (e.g. product:{SKU}:buyers)

  ARGV:
    [1] user_id     — Identifier for the buyer (must match create-order)
    [2] refund_qty  — Quantity to put back (number, as string; typically same as buy_qty)

  RETURNS:
    current_stock  — Stock after restore (for logging / debugging)
]]

local stock_key = KEYS[1]
local buyer_key = KEYS[2]
local user_id   = ARGV[1]
local refund_qty = tonumber(ARGV[2])

-- Restore inventory
local current_stock = redis.call("INCRBY", stock_key, refund_qty)

-- Decrement this user's purchase count (or remove field if zero)
local bought = tonumber(redis.call("HGET", buyer_key, user_id) or 0)
local new_bought = bought - refund_qty

if new_bought <= 0 then
    redis.call("HDEL", buyer_key, user_id)
else
    redis.call("HSET", buyer_key, user_id, new_bought)
end

return current_stock
