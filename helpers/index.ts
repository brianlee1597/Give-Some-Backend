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