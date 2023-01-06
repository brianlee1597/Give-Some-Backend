import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Joi from "joi";
import jwt from "jsonwebtoken";
import WebSocket from "ws";
import Game from "../../../models/game";

enum GameUpdate {
  PLAYER_SENT_TOKENS = 0,
  OPPONENT_SENT_TOKENS = 1,
  DONE = 2,
  EXPIRED = 3,
}

export enum GameState {
  WAITING = 0,
  READY = 1,
  DONE = 2,
}

interface GetArenaForm {
  game_id: string;
}

export default async function arena(ws: WebSocket) {
  const req = (ws as any).upgradeReq;
  const authorization = req.headers.authorization;

  if (!authorization) {
    ws.close();
    return;
  }

  const token = authorization.split(" ")[1];
  let decoded_jwt: any;

  jwt.verify(
    token,
    process.env.JWT_SECRET_KEY! as string,
    (err: any, decoded: any) => {
      if (err) {
        ws.close();
        return;
      }

      decoded_jwt = decoded;
    }
  );

  const { nickname, game_id } = decoded_jwt.game_id;

  let game: any = await Game.findById(game_id);

  if (!game || game.status === GameState.DONE) {
    ws.close();
    return;
  }

  ws.send({
    message: "game arena connection established",
    data: null,
  });

  let playerChanged = false,
    opponentChanged = false;

  let playerTokens: string =
      nickname === game.playerID ? "playerTokens" : "opponentTokens",
    opponentTokens: string =
      nickname === game.playerID ? "opponentTokens" : "playerTokens";

  const changeStream = Game.watch([
    {
      $match: {
        "documentKey._id": game._id,
        "updateDescription.updatedFields.playerTokens.given": {
          $exists: true,
        },
        "updateDescription.updatedFields.opponentTokens.given": {
          $exists: true,
        },
      },
    },
  ]);

  changeStream.on("change", async (change: any) => {
    const playerSent =
      change.updateDescription.updatedFields[playerTokens]?.given;
    const opponentSent =
      change.updateDescription.updatedFields[opponentTokens]?.given;

    if (playerSent) {
      if (!opponentChanged) {
        // player sent first, opponent has not chosen yet.
        ws.send({
          message: "update: player sent tokens",
          data: {
            update_type: GameUpdate.PLAYER_SENT_TOKENS,
            sent_count: playerSent,
          },
        });
      } else {
        // opponent sent change first, then player sent change: game is over.
        await Game.findByIdAndUpdate(game._id, {
          $set: {
            status: GameState.DONE,
            timestamp: Date.now(),
          },
        });

        changeStream.close();
        return ws.close();
      }

      playerChanged = true;
    }

    if (opponentSent) {
      if (!playerChanged) {
        // opponent sent first, player hasn't chosen yet
        ws.send({
          message: "update: opponent sent tokens",
          data: {
            update_type: GameUpdate.OPPONENT_SENT_TOKENS,
            sent_count: opponentSent,
          },
        });
      } else {
        // player sent change first, then opponent sent change: game is over.
        await Game.findByIdAndUpdate(game._id, {
          $set: {
            status: GameState.DONE,
            timestamp: Date.now(),
          },
        });

        changeStream.close();
        return ws.close();
      }

      opponentChanged = true;
    }
  });
}

const validate = (body: GetArenaForm) => {
  const game = Joi.object({
    game_id: Joi.string().required(),
  });
  return game.validate(body);
};

export async function getArenaWebSocketInfo(
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

  const auth_token = jwt.sign(
    { game_id: req.body.game_id, nickname },
    process.env.JWT_SECRET_KEY! as string
  );

  return res.status(StatusCodes.OK).json({
    ws_url: "ws://localhost:8888",
    auth_token,
  });
}
