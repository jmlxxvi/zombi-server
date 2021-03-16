import { v4 as uuidv4 } from "uuid";

import Ajv from "ajv";

const ajv = new Ajv();

export const validate_schema = (schema: Record<string, unknown>, data: Record<string, unknown> | string, throw_on_invalid = true): boolean => {

    const valid = ajv.validate(schema, data);

    if (!valid && throw_on_invalid) throw new Error(`JSON schema validation error: ${ajv.errorsText()}`);

    return valid as boolean;

};

export const timestamp = (ms: number|boolean = false): number => { return ms ? Date.now() : Math.floor(Date.now() / 1000); };

export const token_shortener = (token: string): string => {
    if (token) {
        // return token.substr(0, 10) + "..." + token.substr(-10);
        return "..." + token.substr(-8);
    } else {
        return "none";
    }
};

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const uuid = (): string => uuidv4();
