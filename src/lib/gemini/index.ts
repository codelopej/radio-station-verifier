import {
	type GenerativeModel,
	GoogleGenerativeAI,
} from "@google/generative-ai";

const systemInstruction = `
  You are a specialist in information verification for a data center. You have been assigned the task of verifying the city and state location of the origin of a U.S. radio station based on its call sign. Use the tools at your disposal to certify and provide this information, such as Wikipedia, Google Search, government radio station records, etc.
  
  <call_sign_input_format>
    The call signs will be provided as a string, separated by commas, e.g.: "WEDR-FM Stream, WEDR-FM".
  </call_sign_input_format>

  <response_output_format>
    You will be provided with lists of these IDs sequentially. You must return your response in JSON format with the following structure:

    { 
      "stations": [ 
        { 
          "callSign": (value), 
          "frequencyType": (value), 
          "frequency": (value), 
          "city": (value), 
          "state": (value) 
        }, 
        ... 
      ] 
    }
  </response_output_format>

  <clean_response>
    Take care to remove any unnecessary information from the response, such as text formatting, extra spaces, etc. provide the data ready to be parsed as JSON.
    City or state names like "Coeur d"Alene" should be cleaned to "Coeur dAlene", this is important for the response to be correctly parsed.
  </clean_response>

  <example>
    Input: "WEDR-FM Stream, WEDR-FM"
    Output: { 
      "stations": [ 
        { 
          "callSign": "WEDR-FM Stream",
          "frequencyType": "FM",
          "frequency": "99.1",
          "city": "Miami",
          "state": "FL"
        },
        { 
          "callSign": "WEDR-FM",
          "frequencyType": "FM",
          "frequency": "99.1",
          "city": "Miami",
          "state": "FL"
        }
      ]
    }
`;

export class GeminiClient {
	private static instance: GenerativeModel | null = null;

	private constructor() {}

	public static getInstance(): GenerativeModel {
		if (!GeminiClient.instance) {
			const genAI = new GoogleGenerativeAI(Bun.env.GOOGLE_GEMINI_API_KEY);

			GeminiClient.instance = genAI.getGenerativeModel({
				model: "gemini-2.0-pro-exp-02-05",
				systemInstruction,
			});
		}

		return GeminiClient.instance;
	}
}
