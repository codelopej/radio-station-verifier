import path from "node:path";
import "@env";
import type {
	NielsenRadioStationRecord,
	NielsenRadioStationRecordV0125,
} from "@types";
import { DATASOURCES, NIELSEN_RADIO_STATION_KEYS } from "@constants";
import {
	exportToJSON,
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

		if (Number(Bun.env.PROCESS_DATA)) {
			const transformedData: NielsenRadioStationRecord[] = csvData.map((row) =>
				transformCsvRowData<NielsenRadioStationRecord>(row, [
					...NIELSEN_RADIO_STATION_KEYS,
				]),
			);

			await processData(transformedData);
		}

		if (Number(Bun.env.EXPORT_DATA)) {
			const transformedData: NielsenRadioStationRecordV0125[] = csvData.map(
				(row) =>
					transformCsvRowData<NielsenRadioStationRecordV0125>(row, [
						...NIELSEN_RADIO_STATION_KEYS,
						"oct",
						"nov",
						"dec",
					]),
			);

			await exportToJSON(transformedData);
		}

		// await TursoClient.close(); // Always close the database connection
	} catch (error) {
		console.error("An error occurred in the main process:", error);

		process.exit(1); // Exit the process on a top-level error.
	}
}

main();
