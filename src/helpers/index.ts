import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";
import { DrizzleClient } from "@lib/drizzle";
import type {
	DrizzleDatabase,
	GeneratedResponse,
	NielsenRadioStationRecord,
	RadioStation,
	StructuredCsvNielsenRadioStationsFile,
} from "@types";
import { radioStationsTable } from "@lib/drizzle/schemas";
import { GeminiClient } from "@lib/gemini";

const GENERATE_GROUPED_DATA_DELAY = 60000;

export const fileExists = async (filePath: string): Promise<boolean> => {
	try {
		await fs.promises.access(filePath);

		return true;
	} catch {
		return false;
	}
};

export const processCSV = async (
	filePath: string,
): Promise<StructuredCsvNielsenRadioStationsFile[]> => {
	try {
		const fileContent = await fs.promises.readFile(filePath, {
			encoding: "utf8",
		});

		const records = parse(fileContent, {
			columns: true, // Treat the first row as headers
			skip_empty_lines: true,
			trim: true, // Trim whitespace from values
		});

		return records;
	} catch (error) {
		console.error("Error reading or parsing CSV:", error);

		throw error; // Re-throw to be handled by the caller.
	}
};

export const transformCsvRowData = <T extends Record<string, unknown>>(
	row: Record<string, unknown>,
	keys: Array<keyof T>,
): T => {
	const typedReturn = {} as T;

	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		typedReturn[key] = Object.values(row)[i] as T[keyof T];
	}

	return typedReturn;
};

export function cleanJsonString(input: string): string {
	// Remove markdown code marks (```json and ```)
	let cleaned = input.replace(/```json\n|\n```/g, "");

	// Remove possible trailing commas in objects and arrays
	cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

	// Remove comments (if they exist)
	cleaned = cleaned.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1");

	// Normalize quotes (in case there are single quotes)
	cleaned = cleaned.replace(/'/g, '"');

	return cleaned;
}

export const processData = async (rows: NielsenRadioStationRecord[]) => {
	try {
		for (const row of rows) {
			await insertRadioStationIfNotExists(row);
		}

		const groupedData = groupByMarket(rows);

		if (Object.keys(groupedData).length > 0) {
			for (const marketGroup of Object.keys(groupedData)) {
				if (!marketGroup || !groupedData[marketGroup]) {
					continue;
				}

				await processGroupedData(groupedData[marketGroup]);
			}
		}
	} catch (error) {
		console.error("Error checking if table exists:", error);

		setTimeout(() => processData(rows), GENERATE_GROUPED_DATA_DELAY);
	}
};

const insertRadioStationIfNotExists = async (
	row: NielsenRadioStationRecord,
) => {
	if (
		!row.callSign ||
		row.callSign === "Subscriber" ||
		row.format === "Format"
	) {
		return;
	}

	const db: DrizzleDatabase = DrizzleClient.getInstance();

	const matchedCriteria = await db
		.select()
		.from(radioStationsTable)
		.where(eq(radioStationsTable.callSign, row.callSign));

	if (matchedCriteria?.length === 0) {
		const radioStationToInsert: RadioStation = {
			id: randomUUID(),
			market: row.market,
			callSign: row.callSign,
			format: row.format,
		};

		await db.insert(radioStationsTable).values(radioStationToInsert);
	}
};

const updateRadioStation = async (radio: GeneratedResponse) => {
	if (!radio.callSign) {
		return;
	}

	const db: DrizzleDatabase = DrizzleClient.getInstance();

	const matchedCriteria = await db
		.select()
		.from(radioStationsTable)
		.where(eq(radioStationsTable.callSign, radio.callSign));

	if (matchedCriteria?.length) {
		for (const matchedRadio of matchedCriteria) {
			if (matchedRadio.city && matchedRadio.state) {
				continue;
			}

			const radioStationToUpdate: RadioStation = {
				...matchedRadio,
				city: radio.city,
				state: radio.state,
			};

			await db
				.update(radioStationsTable)
				.set(radioStationToUpdate)
				.where(eq(radioStationsTable.callSign, radio.callSign));
		}
	}
};

const groupByMarket = (rows: NielsenRadioStationRecord[]) => {
	const groupedData: Record<string, NielsenRadioStationRecord[]> = {};

	for (const row of rows) {
		if (!groupedData[row.market]) {
			groupedData[row.market] = [];
		}

		groupedData[row.market].push(row);
	}

	return groupedData;
};

const isMarketGroupProcessed = async (marketGroup: string) => {
	const db: DrizzleDatabase = DrizzleClient.getInstance();

	const matchedCriteria = await db
		.select()
		.from(radioStationsTable)
		.where(eq(radioStationsTable.market, marketGroup));

	return matchedCriteria?.every((station) => station.city && station.state);
};

const processGroupedData = async (groupedData: NielsenRadioStationRecord[]) => {
	if (!groupedData?.length) {
		return;
	}

	const marketGroup = groupedData[0].market;

	if (await isMarketGroupProcessed(marketGroup)) {
		console.log("Market group already processed:", marketGroup);

		return;
	}

	const model = GeminiClient.getInstance();
	const modelInput = groupedData.map((station) => station.callSign).join(", ");

	const result = await model.generateContent({
		contents: [
			{
				role: "user",
				parts: [
					{
						text: modelInput,
					},
				],
			},
		],
	});

	try {
		const { stations } = JSON.parse(
			cleanJsonString(result.response.text()),
		) as { stations: GeneratedResponse[] };

		for (const station of stations) {
			await updateRadioStation(station);
		}

		console.log("Successfully processed grouped data: ", marketGroup);
	} catch (error) {
		console.error("Error parsing JSON:", error);
		console.log({ resultText: cleanJsonString(result.response.text()) });
	}
};
