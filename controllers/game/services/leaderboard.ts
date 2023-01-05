import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Account, { AccountSchema } from "../../../models/account";

export default async function leaderboard(
  _: Request,
  res: Response
): Promise<Response | undefined> {
  const leaderboard: AccountSchema[] = await Account.find()
    .sort({ token_count: -1 })
    .limit(100);

  if (!leaderboard) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "something went wrong with server, please try again",
      data: null,
    });
  }

  const necessaryInfo = leaderboard.map(({ nickname, token_count }) => {
    return {
      nickname,
      token_count,
    };
  });

  return res.status(StatusCodes.OK).json({
    message: "success",
    data: {
      leaderboard: necessaryInfo,
    },
  });
}
