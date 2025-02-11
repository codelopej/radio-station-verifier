declare module "bun" {
	interface Env {
		GOOGLE_GEMINI_API_KEY: string;
		NODE_ENV: string;
		TURSO_LIB_SQL_HOST: string;
		PROCESS_DATA: string;
		EXPORT_DATA: string;
	}
}
