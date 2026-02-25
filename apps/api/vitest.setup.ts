// Set required env vars before any test or app code loads config
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "mongodb://127.0.0.1:27017/test";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
