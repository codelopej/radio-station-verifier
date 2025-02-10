import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const radioStationsTable = sqliteTable(
	"radio_stations",
	{
		id: text("id").primaryKey(),
		market: text("market").notNull(),
		callSign: text("call_sign").notNull().unique(),
		format: text("format"),
		city: text("city"),
		state: text("state"),
	},
	(table) => [uniqueIndex("call_sign_idx").on(table.callSign)],
);

export const generatedResponseVersions = sqliteTable(
	"generated_response_versions",
	{
		id: text("id").primaryKey(),
		marketGroup: text("market_group").notNull(),
	},
);
