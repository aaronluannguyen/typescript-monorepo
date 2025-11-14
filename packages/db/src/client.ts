import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { Effect, Layer, Context } from "effect";

// Database connection configuration
export const createDbConnection = (connectionString: string) => {
  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client, { schema });
};

// Effect-based database service
export class DatabaseService extends Context.Tag("DatabaseService")<
  DatabaseService,
  ReturnType<typeof createDbConnection>
>() {}

// Layer for providing the database service
export const DatabaseLive = Layer.effect(
  DatabaseService,
  Effect.sync(() => {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    return createDbConnection(connectionString);
  })
);

// Export the database type
export type Database = ReturnType<typeof createDbConnection>;
