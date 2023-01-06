import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import Account from "../../../models/account";
import Game from "../../../models/game";
import { GameState } from "./arena";

interface SendTokensForm {
  game_id: string;
  tokens_sent: number;
}

const validate = (body: SendTokensForm) => {
  const game = Joi.object({
    game_id: Joi.string().required(),
    tokens_sent: Joi.number().max(4).required(),
  });
  return game.validate(body);
};

export default async function sendTokens(
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

  let game: any = await Game.findById(req.body.game_id);

  if (!game || game.status === GameState.DONE) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "no game found with that id",
      data: null,
    });
  }

  const { nickname } = (req as any).decoded;

  if (nickname !== game.playerID && nickname !== game.opponentID) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "you are not authorized to send tokens to this game",
      data: null,
    });
  }

  let playerTokens: string =
    nickname === game.playerID ? "playerTokens" : "opponentTokens";
  let opponentTokens: string =
    nickname === game.playerID ? "opponentTokens" : "playerTokens";

  game = await Game.findByIdAndUpdate(
    req.body.game_id,
    {
      $set: {
        [playerTokens]: {
          given: req.body.tokens_sent,
        },
      },
    },
    { new: true }
  );

  if (game[opponentTokens].given != null) {
    const { newPlayerTokenCount, newOpponentTokenCount } =
      await calculateTokenCount(game);

    await Account.findOneAndUpdate(
      { nickname: game.playerID },
      {
        $set: {
          token_count: newPlayerTokenCount,
        },
      }
    );

    await Account.findOneAndUpdate(
      { nickname: game.opponentID },
      {
        $set: {
          token_count: newOpponentTokenCount,
        },
      }
    );

    return res.status(StatusCodes.OK).json({
      message: "token successfully sent",
      data: {
        status: GameState.DONE,
      },
    });
  }

  return res.status(StatusCodes.OK).json({
    message: "token successfully sent",
    data: {
      status: GameState.READY,
    },
  });
}

export async function calculateTokenCount(game: any): Promise<any> {
  const playerAvailable = game.playerTokens.available;
  const playerGiven = game.playerTokens.given;
  const opponentAvailable = game.opponentTokens.available;
  const opponentGiven = game.opponentTokens.given;

  const player: any = await Account.findOne({ nickname: game.playerID });
  const opponent: any = await Account.findOne({ nickname: game.opponentID });

  /**
   * if both give non-zero, then its swapped and multiplied by 2
   * if one gives zero, they take half of the other person's money (if the other person has just 2 left, they take everything and it goes to zero)
   * if both gives zero, then both of their tokens are cut by half
   */

  let newPlayerTokenCount, newOpponentTokenCount;

  if (playerGiven === 0 && opponentGiven === 0) {
    newPlayerTokenCount = player.token_count === 2 ? 0 : player.token_count / 2;
    newOpponentTokenCount =
      opponent.token_count === 2 ? 0 : opponent.token_count / 2;
  } else if (playerGiven === 0) {
    newPlayerTokenCount =
      player.token_count +
      (opponent.token_count === 2 ? 2 : opponent.token_count / 2);
    newOpponentTokenCount =
      opponent.token_count === 2 ? 0 : opponent.token_count / 2 - opponentGiven;
  } else if (opponentGiven === 0) {
    newPlayerTokenCount =
      player.token_count === 2 ? 0 : player.token_count / 2 - playerGiven;
    newOpponentTokenCount =
      opponent.token_count +
      (player.token_count === 2 ? 2 : player.token_count / 2);
  } else {
    newPlayerTokenCount = player.token_count - playerGiven + opponentGiven * 2;
    newOpponentTokenCount =
      opponent.token_count - opponentGiven + playerGiven * 2;
  }

  const gameResults = {
    [game.playerID]: {
      nickname: game.playerID,
      opponent_name: game.opponentID,
      available: playerAvailable,
      given: playerGiven,
      gotten: opponentGiven,
      before_game: player.token_count,
      after_game: newPlayerTokenCount,
    },
    [game.opponentID]: {
      nickname: game.opponentID,
      opponent_name: game.playerID,
      available: opponentAvailable,
      given: opponentGiven,
      gotten: playerGiven,
      before_game: opponent.token_count,
      after_game: newOpponentTokenCount,
    },
  };

  return {
    newPlayerTokenCount,
    newOpponentTokenCount,
    gameResults,
  };
}
