import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

dotenv.config();

export async function hash(string: string) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(string, salt);
  return hash;
}

export const verifyJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | undefined => {
  const authorization = req.headers["authorization"];

  if (!authorization) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "no auth token provided",
      data: null,
    });
  }

  const [_, token] = authorization.split(" ");

  jwt.verify(
    token,
    process.env.JWT_SECRET_KEY! as string,
    (err: any, decoded: any) => {
      if (err) {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: "authorization failed",
          data: err,
        });
      }

      (req as any).decoded = decoded;
      next();
    }
  );
};

export const keepConnectionAlive = (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader("Connection", "keep-alive");
  next();
};
