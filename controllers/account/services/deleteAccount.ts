import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Account from "../../../models/account";
import bcrypt from "bcrypt";
import Joi from "joi";

interface DeleteAccountRequestBody {
  nickname: string;
  email: string;
  password: string;
}

const validate = (body: DeleteAccountRequestBody) => {
  const account = Joi.object({
    nickname: Joi.string().min(1).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(3).max(30).required(),
  });
  return account.validate(body);
};

export default async function deleteAccount(
  req: Request,
  res: Response
): Promise<Response | undefined> {
  const { errors }: any = validate(req.body);

  if (errors) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "invalid request body",
      data: errors,
    });
  }

  const { nickname, email, password } = req.body;

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

  account.delete((error: any) => {
    if (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "account deletion failed, please try again",
        data: error,
      });
    }

    return res.status(StatusCodes.OK).json({
      message: "account deletion complete",
      data: null,
    });
  });
}
