import type { Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { TursoClient } from "@lib/turso";
import type { DrizzleDatabase } from "@types";

export class DrizzleClient {
	private static instance: DrizzleDatabase;

	private constructor() {}

	public static getInstance(): DrizzleDatabase {
		if (!DrizzleClient.instance) {
			const client: Client = TursoClient.getInstance();
			DrizzleClient.instance = drizzle(client);
		}

		return DrizzleClient.instance;
	}
}
