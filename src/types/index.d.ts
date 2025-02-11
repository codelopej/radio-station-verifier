import type { Client } from "@libsql/client";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { NIELSEN_RADIO_STATION_KEYS } from "@constants";
import type { radioStationsTable } from "@lib/drizzle/schemas";

export type DrizzleDatabase = LibSQLDatabase<Record<string, never>> & {
	$client: Client;
};

export type StructuredCsvNielsenRadioStationsFile = {
	market: string;
	callSign: string;
	format: string;
	// months audience share data
	[key: string]: string;
};

export type NielsenRadioStationRecord = {
	[K in (typeof NIELSEN_RADIO_STATION_KEYS)[number]]: string;
};

export type NielsenRadioStationRecordV0125 = NielsenRadioStationRecord & {
	oct: string;
	nov: string;
	dec: string;
};

export type RadioStation = typeof radioStationsTable.$inferInsert;

export type RadioStationWithRatings = RadioStation & {
	ratings: Array<Record<string, string>>;
};

export type GeneratedResponse = {
	callSign?: string;
	frequencyType?: string;
	frequency?: string;
	city?: string;
	state?: string;
};
