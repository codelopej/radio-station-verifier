import { type Client, createClient } from "@libsql/client";

export class TursoClient {
	private static instance: Client | null = null;

	private constructor() {}

	public static getInstance(): Client {
		if (!TursoClient.instance) {
			TursoClient.instance = createClient({
				url: Bun.env.TURSO_LIB_SQL_HOST,
			});
		}

		return TursoClient.instance;
	}

	public static async close(): Promise<void> {
		if (TursoClient.instance) {
			await TursoClient.instance.close();
			TursoClient.instance = null;
		}
	}
}
