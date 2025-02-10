import path from "node:path";
import "@env";
import { TursoClient } from "@lib/turso";
import type { NielsenRadioStationRecord } from "@types";
import { DATASOURCES, NIELSEN_RADIO_STATION_KEYS } from "@constants";
import {
	fileExists,
	processCSV,
	processData,
	transformCsvRowData,
} from "@helpers";

async function main() {
	try {
		const { NIELSEN_RADIO_STATIONS } = DATASOURCES.CSV;
		const __dirname = path.dirname(__filename);

		const csvPath = path.join(
			__dirname,
			`../datasources/csv/${NIELSEN_RADIO_STATIONS}`,
		);

		if (!(await fileExists(csvPath))) {
			console.error(`Error: CSV file not found at ${csvPath}`);

			process.exit(1); // Exit with an error code
		}

		const csvData = await processCSV(csvPath);

		const transformedData: NielsenRadioStationRecord[] = csvData.map((row) =>
			transformCsvRowData<NielsenRadioStationRecord>(row, [
				...NIELSEN_RADIO_STATION_KEYS,
			]),
		);

		await processData(transformedData);

		// await TursoClient.close(); // Always close the database connection
	} catch (error) {
		console.error("An error occurred in the main process:", error);

		process.exit(1); // Exit the process on a top-level error.
	}
}

main();
