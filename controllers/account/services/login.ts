import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Account from "../../../models/account";
import bcrypt from "bcrypt";
import Joi from "joi";
import jwt from "jsonwebtoken";

interface LoginRequestBody {
  email: string;
  password: string;
}

const validate = (body: LoginRequestBody) => {
  const account = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(3).max(30).required(),
  });
  return account.validate(body);
};

export default async function login(
  req: Request,
  res: Response
): Promise<Response | undefined> {
  const { error }: any = validate(req.body);

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "invalid request body",
      data: error,
    });
  }

  const { email, password } = req.body;

  const account: any = await Account.findOne({ email });

  if (!account) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "no account exists with that email",
      data: null,
    });
  }

  const isMatch: boolean = await bcrypt.compare(password, account.password);

  if (!isMatch) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "password is incorrect",
      data: null,
    });
  }

  const auth_token = jwt.sign(
    { nickname: account.nickname, email },
    process.env.JWT_SECRET_KEY! as string
  );

  return res.status(StatusCodes.OK).json({
    message: "login successful",
    data: {
      account_info: {
        nickname: account.nickname,
        email,
      },
      auth_token,
    },
  });
}
