import { env } from "@/config/env.js";
import { createLogger } from "@repo/logger";
import { type Collection, type Db, type Document, MongoClient } from "mongodb";

const logger = createLogger("database");

const client = new MongoClient(env.DATABASE_URL, {
  maxPoolSize: env.MONGO_POOL_SIZE,
});

let db: Db;

export async function connectMongo(): Promise<void> {
  await client.connect();
  db = client.db();
  logger.info({ dbName: client.options.dbName }, "Connected to MongoDB");
}

export async function disconnectMongo(): Promise<void> {
  await client.close();
  logger.info("Disconnected from MongoDB");
}

export async function getDb(): Promise<Db> {
  return db;
}

export async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  return db.collection<T>(name);
}
