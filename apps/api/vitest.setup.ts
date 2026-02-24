// Set required env vars before any test or app code loads config
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "mongodb://localhost:27017/test";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
