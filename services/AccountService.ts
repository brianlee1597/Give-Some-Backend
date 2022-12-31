import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Filter } from "profanity-check";
import Account, { AccountBody, validate } from "../models/account";
import { hash, ResType, wrapResult } from "../helpers";
import { ERROR, Status } from "./__global_enums";
import { ValidationError } from "joi";

async function createAccount(req: Request, res: Response): Promise<void> {
  const accountCreationForm: AccountBody = req.body;

  const {
    error: accountValidationError,
  }: { error: ValidationError | undefined } = validate(accountCreationForm);

  if (accountValidationError) {
    res.status(Status.BAD_REQUEST);
    res.json(
      wrapResult(
        ResType.ACCOUNT_ERROR,
        accountValidationError.details[0].message
      )
    );
    return;
  }

  let { nickname, email, password } = accountCreationForm;

  const filter: Filter = new Filter();
  const profaneNickname: boolean = filter.isProfane(nickname);

  if (profaneNickname) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.ACCOUNT_ERROR, ERROR.PROFANE_NICKNAME));
    return;
  }

  const nameExists: any = await Account.findOne({ nickname });
  const accountExists: any = await Account.findOne({ email });

  if (nameExists) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.ACCOUNT_ERROR, ERROR.NICKNAME_EXISTS));
    return;
  }

  if (accountExists) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.ACCOUNT_ERROR, ERROR.EMAIL_EXISTS));
    return;
  }

  const token = jwt.sign(
    { nickname, email },
    process.env.JWT_SECRET_KEY! as string
  );

  const newAccount: any = new Account({
    nickname,
    email,
    password: await hash(password),
    token_count: 4,
  });

  newAccount.save((mongooseSaveError: any) => {
    if (mongooseSaveError) {
      res.status(Status.BAD_REQUEST);
      res.json(mongooseSaveError);
      return;
    }

    res.status(Status.GOOD_REQUEST);
    res.json(
      wrapResult(ResType.ACCOUNT_CREATED, {
        message: "account creation successful",
        info: {
          nickname,
          email,
        },
        token,
      })
    );
  });
}

async function login(req: any, res: Response): Promise<void> {
  const email: string = req.body.email;
  const password: string = req.body.password;

  if (!email || !password) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.ACCOUNT_ERROR, ERROR.BAD_REQUEST_BODY));
    return;
  }

  const account: any = await Account.findOne({ email });

  if (!account) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.ACCOUNT_ERROR, ERROR.NO_ACCOUNT_FOUND));
    return;
  }

  const isMatch: boolean = await bcrypt.compare(password, account.password);

  if (!isMatch) {
    res.status(Status.BAD_REQUEST);
    res.json(
      wrapResult(ResType.ACCOUNT_ERROR, {
        message: ERROR.NO_MATCHING_PASSWORD,
        token: null,
      })
    );
    return;
  }

  const token = jwt.sign(
    { nickname: account.nickname, email },
    process.env.JWT_SECRET_KEY! as string
  );

  res.status(Status.GOOD_REQUEST);
  res.json(
    wrapResult(ResType.LOGIN_SUCCESSFUL, {
      message: "login successful",
      info: {
        nickname: account.nickname,
        email,
      },
      token,
    })
  );
}

async function deleteAccount(req: any, res: Response): Promise<void> {
  const nickname: string = req.body.nickname;
  const email: string = req.body.email;
  const password: string = req.body.password;

  if (!email || !password || !nickname) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.BAD_REQUEST_BODY, ERROR.BAD_REQUEST_BODY));
    return;
  }

  if (email !== req.decoded.email || nickname !== req.decoded.nickname) {
    res.status(Status.BAD_AUTH);
    res.json(wrapResult(ResType.ACCOUNT_ERROR, ERROR.JWT_ERROR));
    return;
  }

  const account: any = await Account.findOne({ email });

  if (!account) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.ACCOUNT_ERROR, ERROR.NO_ACCOUNT_FOUND));
    return;
  }

  const isMatch: boolean = await bcrypt.compare(password, account.password);

  if (!isMatch) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.ACCOUNT_ERROR, ERROR.NO_MATCHING_PASSWORD));
    return;
  }

  account.delete((deleteError: any) => {
    if (deleteError) {
      res.status(Status.BAD_REQUEST);
      res.json(wrapResult(ResType.ACCOUNT_ERROR, deleteError));
      return;
    }

    res.status(Status.GOOD_REQUEST);
    res.json(
      wrapResult(ResType.DELETION_SUCCESSFUL, "account deletion complete")
    );
  });
}

export default {
  createAccount,
  login,
  deleteAccount,
};
