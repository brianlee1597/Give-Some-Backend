import bcrypt from "bcrypt";
import * as dotenv from 'dotenv';

dotenv.config();

export function logPretty (object: Object) {
    const pretty = JSON.stringify(object, null, 2);
    console.log(pretty);
}

export async function hash (string: string) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(string, salt);
    return hash;
}

export enum ResType {
    LEADERBOARD = 0,
    INITIAL_GAME_STATS = 1,
    ACCOUNT_CREATED = 2,
    LOGIN_SUCCESSFUL = 3,
    DELETION_SUCCESSFUL = 4,

    GAME_ERROR = 10,
    ACCOUNT_ERROR = 11,

    GAME_STATUS = 20,
    GAME_RESULTS = 21,
}

export function wrapResult (type: Partial<ResType>, data: any) {
    return { type, data }
}