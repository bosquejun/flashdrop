export const COOKIE_USER_ID_NAME = "flashdrop-user-id";

/** Short TTL for sale status so UI gets fresh status/stock without hitting DB every poll. */
export const TTL_SALE_STATUS_MS = 10 * 1000; // 10 seconds

export const TTL_ONE_MINUTE_MS = 1000 * 60;
export const TTL_FIFTEEN_MINUTES_MS = TTL_ONE_MINUTE_MS * 15;
export const TTL_ONE_HOUR_MS = TTL_ONE_MINUTE_MS * 60;
export const TTL_ONE_DAY_MS = TTL_ONE_HOUR_MS * 24;
export const TTL_ONE_WEEK_MS = TTL_ONE_DAY_MS * 7;
export const TTL_ONE_MONTH_MS = TTL_ONE_DAY_MS * 30;
export const TTL_ONE_YEAR_MS = TTL_ONE_DAY_MS * 365;
