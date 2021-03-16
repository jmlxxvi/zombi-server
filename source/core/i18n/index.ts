import session from "../session";
// import log from "../log";

import { DateTime } from "luxon";

import i18n_data from "./labels.json";
import config from "../config";

// Types
import { ZombiI18NData } from "./types";

const lang_data: ZombiI18NData = i18n_data;

const get_lang_data = (lang: string): {[key: string]: string} => lang_data[lang];

const language_exists = (lang: string): boolean => i18n_data && typeof lang_data[lang] !== "undefined";

const label = async (lang_or_token: string, label: string): Promise<string> => {

    let language: string|null;

    if(lang_or_token.length === 2) {

        language = lang_or_token;

    } else {

        language = await session.get(lang_or_token, "language");

    }

    if (language && lang_data[language] && lang_data[language][label]) { return lang_data[language][label]; } else { return "[" + label + "]"; }
};

const format = {
    dates: {
        /**
         * Concverts a timestamp to string date
         * @param params
         * @param params.timestamp Timestamp to convert to date
         * @param params.timezone Timezone to represent the date, defaults to configuration default
         * @param params.format Format to represent the date
         * @returns The timestamp formatted
         */
        ts2date(
            {
                timestamp, 
                timezone = config.i18n.default_timezone, 
                format = "cccc, LLLL dd yyyy, HH:mm:ss"
            }:
            {
                timestamp: number, 
                timezone?: string, 
                format?: string
            }
        ) { 

            return DateTime.fromMillis(timestamp).setZone(timezone).toFormat(format.toString());
            
        }
    }
};

export default { label, get_lang_data, language_exists, format };
