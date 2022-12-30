import crypto from "crypto";
import * as dotenv from 'dotenv';

dotenv.config();

export function logPretty (object: Object) {
    const pretty = JSON.stringify(object, null, 2);
    console.log(pretty);
}

const algorithm = 'aes-256-ctr';
const secret = process.env.AES_SECRET! as string;

export function encrypt (string: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, secret, iv);
    const encrypted = Buffer.concat([cipher.update(string), cipher.final()]);
  
    return {
        data: encrypted.toString('hex'),
        iv: iv.toString('hex')
    }
}

export function decrypt (hash: any) {
    const decipher = crypto.createDecipheriv(algorithm, secret, Buffer.from(hash.iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.data, 'hex')), decipher.final()]);
    return decrpyted.toString();
}