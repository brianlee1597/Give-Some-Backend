import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Filter } from "profanity-check";
import Account from "../../../models/account";
import Joi from "joi";
import jwt from "jsonwebtoken";
import { hash } from "../../../config";

interface CreateAccountRequestBody {
  nickname: string;
  email: string;
  password: string;
}

const validate = (body: CreateAccountRequestBody) => {
  const account = Joi.object({
    nickname: Joi.string().min(1).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(3).max(30).required(),
  });
  return account.validate(body);
};

export default async function createAccount(
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

  const { nickname, email, password } = req.body;

  const filter: Filter = new Filter();
  const profaneNickname: boolean = filter.isProfane(nickname);

  if (profaneNickname) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "this nickname is not allowed",
      data: { nickname },
    });
  }

  const nameExists: any = await Account.findOne({ nickname });
  const accountExists: any = await Account.findOne({ email });

  if (nameExists) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "nickname already exists",
      data: { nickname },
    });
  }

  if (accountExists) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "email already exists",
      data: { email },
    });
  }

  const auth_token = jwt.sign(
    { nickname, email },
    process.env.JWT_SECRET_KEY! as string
  );

  const newAccount: any = new Account({
    nickname,
    email,
    password: await hash(password),
    token_count: 4,
  });

  newAccount.save((error: any) => {
    if (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "account creation failed, please try again",
        data: error,
      });
    }

    return res.status(StatusCodes.OK).json({
      message: "account creation successful",
      data: {
        account_info: {
          nickname,
          email,
        },
        auth_token,
      },
    });
  });
}
