import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import { NextFunction } from "express";
import { Status } from "../services/__global_enums";

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

  GAME_IN_PROGRESS = 21,
  GAME_COMPLETE = 22,
  GAME_DETAILS = 23,

  GAME_AWAITING = 30,
  GAME_READY = 31,

  BAD_REQUEST_BODY = 100,
}

export function wrapResult(status: Partial<ResType | AuthError>, data: any) {
  return { status, data };
}

export enum AuthError {
  INVALID_TOKEN = 0,
  NO_TOKEN = 1,
}

export const verifyJWT = (req: any, res: any, next: NextFunction) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(Status.BAD_AUTH).json(
      wrapResult(AuthError.NO_TOKEN, {
        success: false,
        message: "No token provided",
      })
    );
  }

  const [_, token] = authHeader.split(" ");

  if (token) {
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY! as string,
      (err: any, decoded: any) => {
        if (err) {
          return res.status(Status.BAD_AUTH).json(
            wrapResult(AuthError.INVALID_TOKEN, {
              success: false,
              message: "Token is not valid",
            })
          );
        }

        req.decoded = decoded;
        next();
      }
    );
  } else {
    return res.status(Status.BAD_AUTH).json(
      wrapResult(AuthError.NO_TOKEN, {
        success: false,
        message: "No token provided",
      })
    );
  }
};
