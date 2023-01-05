import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import Game from "../../../models/game";
import { GameState } from "./arena";
import { calculateTokenCount } from "./sendTokens";

interface GetFinalResultsForm {
  game_id: string;
}

const validate = (body: GetFinalResultsForm) => {
  const game = Joi.object({
    game_id: Joi.string().required(),
  });
  return game.validate(body);
};

export default async function getFinalResults(
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

  const game: any = await Game.findById(req.body.game_id);

  if (!game) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "no game found with that id",
      data: null,
    });
  }

  if (game.status !== GameState.DONE) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "game not finished yet",
      data: null,
    });
  }

  const { gameResults } = await calculateTokenCount(game);

  return res.status(StatusCodes.OK).json({
    message: "final results",
    data: gameResults,
  });
}
