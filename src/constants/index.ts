export const DATASOURCES = {
	CSV: {
		NIELSEN_RADIO_STATIONS: "nielsen-radio-stations.csv",
	},
} as const;

export const NIELSEN_RADIO_STATION_KEYS = [
	"market",
	"callSign",
	"format",
] as const;
