import { Request, Response } from "express";
import Account from "../models/account";
import Game from "../models/game";
import { AccountError } from "./AccountService";
import { Status } from "./__global_enums";

interface InitialGameStats {
    id: string;
    opponentID: string;
    playerID: string;
    tokens_available: number;
}

enum GameStatus {
    AWAITING = 0,
    READY = 1,
    TOKENS_SENT = 2,
    GAME_COMPLETE = 3,
}

enum GameError {
    PLAYER_DOESNT_EXIST = "cannot join game, player doesn't exist.",
    GAME_NOT_FOUND = "game does not exist.",
    WRONG_ID = "you are not authorised to play in this game",
    ALREADY_COMPLETE = "game already finished, not authorised to send tokens",
    NOT_STARTED_YET = "game hasn't started yet, still looking for someone to join",
}

export default class GameService {

    public async leaderboard (_: Request, res: Response): Promise<void> {
        const leaderboard = await Account
            .find()
            .sort({ token_count: -1 })
            .limit(100);

        const necessaryInfo = leaderboard.map((schema: any) => {
            const nickname = schema.nickname as string;
            const token_count = schema.token_count as number;

            return { 
                nickname, 
                token_count 
            }
        })

        res.status(Status.GOOD_REQUEST);
        res.send(necessaryInfo);
    }

    public async join (req: Request, res: Response): Promise<void> { // do tokens available here instead
        const { nickname } = req.body;

        const player: any = await Account.findOne({ nickname });

        if (!player) {
            res.status(Status.BAD_REQUEST);
            res.send(GameError.PLAYER_DOESNT_EXIST);
            return;
        }

        let status: Partial<GameStatus> = GameStatus.READY;
        let tokensAvailable: number = Math.min(4, player.token_count);

        let game: any = await Game.findOneAndUpdate(
            {
                status: GameStatus.AWAITING,
                playerID: { $ne: nickname },
                opponentID: { $ne: nickname },
            },
            {
                $set: {
                    status: GameStatus.READY,
                    opponentID: nickname,
                    opponentTokens: {
                        available: tokensAvailable
                    }
                }
            }
        );

        if (!game) {
            status = GameStatus.AWAITING,

            game = await Game.create({
                status,
                playerID: nickname,
                playerTokens: {
                    available: tokensAvailable
                }
            })
        } else {
            setTimeout(async () => {
                const progress: any = await Game.findById(game._id);

                if (
                    !progress?.playerTokens.given || 
                    !progress?.opponentTokens.given
                ) {
                    await Game.findByIdAndDelete(game._id);
                    console.log("AFK game deleted");
                }
            }, 30000); //30 seconds max game time
        }

        res.status(Status.GOOD_REQUEST);
        res.json({
            status,
            id: game._id
        })
    }

    public async getGameArena (req: Request, res: Response): Promise<void> {
        const gameId: string = req.body.id;
        const nickname: string = req.body.nickname;

        let game: any = await Game.findById(gameId);
        let account: any = await Account.findOne({ nickname });

        if (!game) {
            res.status(Status.BAD_REQUEST);
            res.send(GameError.GAME_NOT_FOUND);
            return;
        }

        if (!account) {
            res.status(Status.BAD_REQUEST);
            res.send(AccountError.NO_ACCOUNT_FOUND);
            return;
        }

        if (!game.playerID || !game.opponentID) {
            res.status(Status.BAD_REQUEST);
            res.send(GameError.NOT_STARTED_YET);
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
                res.send(GameError.PLAYER_DOESNT_EXIST);
                return;
        }

        const initialGameStats: InitialGameStats = {
            id: game._id,
            opponentID,
            playerID,
            tokens_available: tokensAvailable,
        }

        res.status(Status.GOOD_REQUEST);
        res.send(initialGameStats);
    }

    public async sendTokens (req: Request, res: Response): Promise<void> {
        const gameId: string = req.body.id;
        const nickname: string = req.body.nickname;
        const tokensSent: number = req.body.tokens_sent;

        let game: any = await Game.findById(gameId);

        if (!game) {
            res.status(Status.BAD_REQUEST);
            res.send(GameError.GAME_NOT_FOUND);
            return;
        }

        if (game.playerTokens.given !== null && game.opponentTokens.given !== null) {
            res.status(Status.BAD_REQUEST);
            res.send(GameError.ALREADY_COMPLETE);
            return;
        }

        switch (nickname) {
            case game.playerID:
                game = await Game.findByIdAndUpdate(gameId, {
                    $set: {
                        playerTokens: {
                            given: tokensSent
                        }
                    }
                })

                break;
            case game.opponentID:
                game = await Game.findByIdAndUpdate(gameId, {
                    $set: {
                        opponentTokens: {
                            given: tokensSent
                        }
                    }
                })

                break;
            default:
                res.status(Status.BAD_REQUEST);
                res.send(GameError.WRONG_ID);
                return;
        }

        if (game.playerTokens.given !== null && game.opponentTokens.given !== null) {
            res.status(Status.GOOD_REQUEST);
            res.send(GameStatus.GAME_COMPLETE);

            //delete the game after 5 seconds
            setTimeout(() => {
                Game.findByIdAndDelete(gameId);
            }, 5e4);
        } else {
            res.status(Status.GOOD_REQUEST);
            res.send(GameStatus.TOKENS_SENT);
        }
    }

    public async getGameStats (req: Request, res: Response): Promise<void> {
        const id = req.body.id;
        const nickname = req.body.nickname;

        const game: any = await Game.findById(id);

        if (!game) { // either there was no game to begin with, the game has been deleted from both AFK, or the game ended.
            // in this case we do nothing to tokens in both sides.

            // if this is called from inside an arena, this means that one or both were afk. otherwise, line 228 will be hit
            // and it will show different ui. This conditional should show afk ui and game ending ui after 30 seconds on frontend.
            res.status(Status.BAD_REQUEST);
            res.send(GameError.GAME_NOT_FOUND);
            return;
        }

        // this is when a non-playing user calls from postman or something that has nothing to do with people in game.
        if (game.playerID !== nickname && game.opponentID !== nickname) {
            res.status(Status.BAD_REQUEST);
            res.send(GameError.WRONG_ID);
            return;
        }

        // this is when both players have sent tokens, so game should end now.
        if (game.playerTokens.given !== null && game.opponentTokens.given !== null) {
            // game complete, do calculation for user, send stats and update.
        }

        // send the current game progress
    }
}