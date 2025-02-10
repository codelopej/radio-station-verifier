import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "turso", // 'postgresql' | 'mysql' | 'sqlite' | 'turso'
	schema: "./src/lib/drizzle/schemas/index.ts",
	dbCredentials: {
		url: process.env.TURSO_LIB_SQL_HOST,
	},
});
