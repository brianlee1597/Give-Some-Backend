import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Account from "../../../models/account";
import Game from "../../../models/game";
import { GameState } from "./arena";

export default async function joinGame(
  req: Request,
  res: Response
): Promise<Response | undefined> {
  const nickname = (req as any).decoded.nickname;
  const player: any = await Account.findOne({ nickname });

  let game: any = await Game.findOneAndUpdate(
    {
      status: GameState.WAITING,
      playerID: { $ne: nickname },
      opponentID: { $ne: nickname },
    },
    {
      $set: {
        status: GameState.READY,
        opponentID: nickname,
        opponentTokens: {
          available: Math.min(4, player.token_count),
        },
      },
    }
  );

  if (!game) {
    game = await Game.create({
      status: GameState.WAITING,
      playerID: nickname,
      playerTokens: {
        available: Math.min(4, player.token_count),
      },
    });

    const changeStream = Game.watch([
      {
        $match: {
          "documentKey._id": game._id,
          "updateDescription.updatedFields.status": {
            $exists: true,
          },
        },
      },
    ]);

    changeStream.on("change", (change: any) => {
      if (change.updateDescription.updatedFields.status === GameState.READY)
        return res.status(StatusCodes.OK).json({
          message: "game succesfully joined",
          data: {
            game_id: game._id,
          },
        });
    });
  } else {
    return res.status(StatusCodes.OK).json({
      message: "game succesfully joined",
      data: {
        game_id: game._id,
      },
    });
  }
}
