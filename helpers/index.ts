import bcrypt from "bcrypt";
import * as dotenv from "dotenv";

dotenv.config();

export function logPretty(object: Object) {
  const pretty = JSON.stringify(object, null, 2);
  console.log(pretty);
}

export async function hash(string: string) {
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
  GAME_IN_PROGRESS = 21,
  GAME_COMPLETE = 22,

  GAME_AWAITING = 30,
  GAME_READY = 31,
}

export function wrapResult(status: Partial<ResType>, data: any) {
  return { status, data };
}
