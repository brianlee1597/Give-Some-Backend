import { Request, Response } from "express";
import { logPretty, ResType, wrapResult } from "../helpers";
import Account from "../models/account";
import Game from "../models/game";
import { AccountError } from "./AccountService";
import { Status } from "./__global_enums";

interface InitialGameStats {
  id: string;
  opponent_id: string;
  player_id: string;
  tokens_available: number;
}

interface NewTokenCount {
  newPlayerTokenCount: number;
  newOpponentTokenCount: number;
  gameResults: any;
}

interface CurrentProgress {
  ["string"]: {
    nickname: string;
    given: boolean;
  };
  ["string"]: {
    nickname: string;
    given: boolean;
  };
}

enum GameStatus {
  TOKENS_SENT = "tokens sent",
  GAME_COMPLETE = "game complete",
}

enum GameError {
  PLAYER_DOESNT_EXIST = "cannot join game, player doesn't exist.",
  GAME_NOT_FOUND = "game does not exist.",
  WRONG_ID = "you are not authorised to play in this game",
  ALREADY_COMPLETE = "game already finished, not authorised to send tokens",
  NOT_STARTED_YET = "game hasn't started yet, still looking for someone to join",
  BAD_AMOUNT = "invalid amount of tokens to give",
  INVALID_REQUEST = "invalid request",
}

async function leaderboard(_: Request, res: Response): Promise<void> {
  const leaderboard = await Account.find().sort({ token_count: -1 }).limit(100);

  const necessaryInfo = leaderboard.map((schema: any) => {
    const nickname = schema.nickname as string;
    const token_count = schema.token_count as number;
    return {
      nickname,
      token_count,
    };
  });

  res.status(Status.GOOD_REQUEST);
  res.json(wrapResult(ResType.LEADERBOARD, necessaryInfo));
}

async function join(req: Request, res: Response): Promise<void> {
  // do tokens available here instead
  const { nickname } = req.body;

  const player: any = await Account.findOne({ nickname });

  if (!player) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.GAME_ERROR, GameError.PLAYER_DOESNT_EXIST));
    return;
  }

  let resType: ResType.GAME_READY | ResType.GAME_AWAITING = ResType.GAME_READY;
  let tokensAvailable: number = Math.min(4, player.token_count);

  let game: any = await Game.findOneAndUpdate(
    {
      status: ResType.GAME_AWAITING,
      playerID: { $ne: nickname },
      opponentID: { $ne: nickname },
    },
    {
      $set: {
        status: ResType.GAME_READY,
        opponentID: nickname,
        opponentTokens: {
          available: tokensAvailable,
        },
      },
    }
  );

  if (!game) {
    (resType = ResType.GAME_AWAITING),
      (game = await Game.create({
        status: resType,
        playerID: nickname,
        playerTokens: {
          available: tokensAvailable,
        },
      }));
  } else {
    const DELTA = 1e4;

    setTimeout(async () => {
      const progress: any = await Game.findById(game._id);
      const noOneChoseAnything =
        progress &&
        (!progress.playerTokens.given || !progress.opponentTokens.given);

      if (noOneChoseAnything) {
        await Game.findByIdAndDelete(game._id);
        console.log("AFK game deleted");
      }
    }, 30000 + DELTA); //30 + 1 seconds max game time
  }

  res.status(Status.GOOD_REQUEST);
  res.json(
    wrapResult(resType, {
      id: game._id,
    })
  );
}

async function getArena(req: Request, res: Response): Promise<void> {
  const gameId: string = req.body.id;
  const nickname: string = req.body.nickname;

  let game: any = await Game.findById(gameId);
  let account: any = await Account.findOne({ nickname });

  if (!game) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.GAME_ERROR, GameError.GAME_NOT_FOUND));
    return;
  }

  if (!account) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.ACCOUNT_ERROR, AccountError.NO_ACCOUNT_FOUND));
    return;
  }

  if (!game.playerID || !game.opponentID) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.GAME_ERROR, GameError.NOT_STARTED_YET));
    return;
  }

  let playerID: string, opponentID: string, tokensAvailable: number;

  switch (nickname) {
    case game.playerID:
      playerID = game.playerID;
      opponentID = game.opponentID;
      tokensAvailable = game.playerTokens.available;
      break;
    case game.opponentID:
      playerID = game.opponentID;
      opponentID = game.playerID;
      tokensAvailable = game.opponentTokens.available;
      break;
    default:
      res.status(Status.BAD_REQUEST);
      res.json(wrapResult(ResType.GAME_ERROR, GameError.PLAYER_DOESNT_EXIST));
      return;
  }

  const initialGameStats: InitialGameStats = {
    id: game._id,
    opponent_id: opponentID,
    player_id: playerID,
    tokens_available: tokensAvailable,
  };

  res.status(Status.GOOD_REQUEST);
  res.json(wrapResult(ResType.INITIAL_GAME_STATS, initialGameStats));
}

async function sendTokens(req: Request, res: Response): Promise<void> {
  const gameId: string = req.body.id;
  const nickname: string = req.body.nickname;
  const tokensSent: number = req.body.tokens_sent;

  if (tokensSent < 0) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.GAME_ERROR, GameError.BAD_AMOUNT));
    return;
  }

  let game: any = await Game.findById(gameId);

  if (!game || !game.playerID || !game.opponentID) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.GAME_ERROR, GameError.GAME_NOT_FOUND));
    return;
  }

  if (game.playerTokens.given && game.opponentTokens.given) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.GAME_ERROR, GameError.ALREADY_COMPLETE));
    return;
  }

  let tokenObject: any;

  switch (nickname) {
    case game.playerID:
      if (game.playerTokens.available < tokensSent) {
        res.status(Status.BAD_REQUEST);
        res.json(wrapResult(ResType.GAME_ERROR, GameError.BAD_AMOUNT));
        return;
      }

      tokenObject = {
        playerTokens: {
          available: game.playerTokens.available,
          given: tokensSent,
        },
      };

      break;
    case game.opponentID:
      if (game.opponentTokens.available < tokensSent) {
        res.status(Status.BAD_REQUEST);
        res.json(wrapResult(ResType.GAME_ERROR, GameError.BAD_AMOUNT));
        return;
      }

      tokenObject = {
        opponentTokens: {
          available: game.opponentTokens.available,
          given: tokensSent,
        },
      };

      break;
    default:
      res.status(Status.BAD_REQUEST);
      res.json(wrapResult(ResType.GAME_ERROR, GameError.WRONG_ID));
      return;
  }

  game = await Game.findByIdAndUpdate(
    gameId,
    {
      $set: tokenObject,
    },
    { new: true }
  );

  const playerGiven = game.playerTokens.given;
  const opponentGiven = game.opponentTokens.given;

  if (playerGiven != null && opponentGiven != null) {
    /* ========== Updating Players' token state =========== */
    const { newPlayerTokenCount, newOpponentTokenCount }: NewTokenCount =
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
    /* ========== Updating Players' token state =========== */
    res.status(Status.GOOD_REQUEST);
    res.json(wrapResult(ResType.GAME_COMPLETE, GameStatus.GAME_COMPLETE));

    //delete the game after 10 seconds
    setTimeout(async () => {
      await Game.findByIdAndDelete(gameId);
      console.log(
        `game completed and deleted. [${game.playerID}, ${game.opponentID}]`
      );
    }, 30000);
    return;
  }

  res.status(Status.GOOD_REQUEST);
  res.json(wrapResult(ResType.GAME_IN_PROGRESS, GameStatus.TOKENS_SENT));
}

async function getGameStats(req: Request, res: Response): Promise<void> {
  const id = req.body.id;
  const nickname = req.body.nickname;

  const game: any = await Game.findById(id);

  if (!game) {
    // either there was no game to begin with, the game has been deleted from both AFK, or the game ended.
    // in this case we do nothing to tokens in both sides.

    // if this is called from inside an arena, this means that one or both were afk. otherwise, line 228 will be hit
    // and it will show different ui. This conditional should show afk ui and game ending ui after 30 seconds on frontend.
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.GAME_ERROR, GameError.GAME_NOT_FOUND));
    return;
  }

  // this is when a non-playing user calls from postman or something that has nothing to do with people in game.
  if (game.playerID !== nickname && game.opponentID !== nickname) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.GAME_ERROR, GameError.WRONG_ID));
    return;
  }

  // this is when both players have sent tokens, so game should end now.
  if (game.playerTokens.given != null && game.opponentTokens.given != null) {
    res.status(Status.GOOD_REQUEST);
    res.json(wrapResult(ResType.GAME_COMPLETE, GameStatus.GAME_COMPLETE));
    return;
  }

  // send the current game progress TODO: Get some fking rest
  const currentProgress = getCurrentProgress(game);

  res.status(Status.GOOD_REQUEST);
  res.json(wrapResult(ResType.GAME_IN_PROGRESS, currentProgress));
}

async function getFinalResults(req: Request, res: Response) {
  const gameId = req.body.id;

  if (!gameId) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.GAME_ERROR, GameError.INVALID_REQUEST));
    return;
  }

  const game = await Game.findById(gameId);

  if (!game) {
    res.status(Status.BAD_REQUEST);
    res.json(wrapResult(ResType.GAME_ERROR, GameError.GAME_NOT_FOUND));
    return;
  }

  const { gameResults } = await calculateTokenCount(game);

  res.status(Status.GOOD_REQUEST);
  res.json(wrapResult(ResType.GAME_DETAILS, gameResults));
}

async function calculateTokenCount(game: any): Promise<NewTokenCount> {
  const playerAvailable = game.playerTokens.available;
  const playerGiven = game.playerTokens.given;
  const opponentAvailable = game.opponentTokens.available;
  const opponentGiven = game.opponentTokens.given;

  const player: any = await Account.findOne({ nickname: game.playerID });
  const opponent: any = await Account.findOne({ nickname: game.opponentID });

  const playerTokenCount = player.token_count - playerAvailable;
  const opponentTokenCount = opponent.token_count - opponentAvailable;

  const multiplicationDelta = (given: number) => (given === 0 ? 3 : 2);
  const playerReceived = opponentGiven * multiplicationDelta(playerGiven);
  const opponentReceived = playerGiven * multiplicationDelta(opponentGiven);

  // if one gives 0, they get 3x if the other person didn't put 0
  let playerChange = playerAvailable - playerGiven + playerReceived;
  let opponentChange = opponentAvailable - opponentGiven + opponentReceived;

  // if both users didn't give anything, they both get nothing and lose the tokens
  if (playerGiven === 0 && opponentGiven === 0) {
    playerChange = 0;
    opponentChange = 0;
  }

  const gameResults = {
    [game.playerID]: {
      nickname: game.playerID,
      opponent_name: game.opponentID,
      available: playerAvailable,
      given: playerGiven,
      gotten: opponentGiven,
      multiplied: playerReceived,
      before_game: playerTokenCount + playerAvailable,
      after_game: playerTokenCount + playerChange,
    },
    [game.opponentID]: {
      nickname: game.opponentID,
      opponent_name: game.playerID,
      available: opponentAvailable,
      given: opponentGiven,
      gotten: playerGiven,
      multiplied: opponentReceived,
      before_game: opponentTokenCount + opponentAvailable,
      after_game: opponentTokenCount + opponentChange,
    },
  };

  return {
    newPlayerTokenCount: playerTokenCount + playerChange,
    newOpponentTokenCount: opponentTokenCount + opponentChange,
    gameResults,
  };
}

function getCurrentProgress(game: any): CurrentProgress {
  // destructure into current progress

  const playerID: string = game.playerID;
  const opponentID: string = game.opponentID;

  const currentProgress: any = {
    [playerID]: {
      nickname: game.playerID,
      given: game.playerTokens.given != null,
    },
    [opponentID]: {
      nickname: game.opponentID,
      given: game.opponentTokens.given != null,
    },
  };

  return currentProgress;
}

export default {
  leaderboard,
  join,
  sendTokens,
  getArena,
  getGameStats,
  getFinalResults,
};
