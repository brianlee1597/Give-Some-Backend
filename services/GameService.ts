import { Request, Response } from "express";
import Account from "../models/account";
import Game from "../models/game";
import { Status } from "./__global_enums";

enum GameStatus {
    AWAITING = 0,
    READY = 1,
    TOKENS_SENT = 2,
    GAME_COMPLETE = 3,
}

enum GameError {
    PLAYER_DOESNT_EXIST = "cannot join game, player doesn't exist. bad request",
    GAME_NOT_FOUND = "game does not exist, bad request",
    WRONG_ID = "you are not authorised to play in this game"
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

    public async join (req: Request, res: Response): Promise<void> {
        const { nickname } = req.body;

        const player = await Account.findOne({ nickname });

        if (!player) {
            res.status(400);
            res.send(GameError.PLAYER_DOESNT_EXIST);
            return;
        }

        let status = GameStatus.READY;

        let game = await Game.findOneAndUpdate(
            {
                status: GameStatus.AWAITING,
                playerID: { $ne: nickname },
            },
            {
                $set: {
                    status: GameStatus.READY,
                    opponentID: nickname,
                }
            }
        );

        if (!game) {
            status = GameStatus.AWAITING,

            game = await Game.create({
                status,
                playerID: nickname,
            })
        }

        res.status(200);
        res.json({
            status,
            id: game._id
        })
    }

    public async sendTokens (req: Request, res: Response): Promise<void> {
        const gameId = req.body.id;
        const nickname = req.body.nickname;
        const tokensSent = req.body.token_count;

        let game: any = await Game.findOne({ _id: gameId });

        if (!game) {
            res.status(400);
            res.send(GameError.GAME_NOT_FOUND);
            return;
        }

        switch (nickname) {
            case game.playerID:
                game = await Game.findByIdAndUpdate(gameId, {
                    $set: {
                        playerTokens: tokensSent
                    }
                })

                break;
            case game.opponentID:
                game = await Game.findByIdAndUpdate(gameId, {
                    $set: {
                        opponentTokens: tokensSent
                    }
                })

                break;
            default:
                res.status(400);
                res.send(GameError.WRONG_ID);
                return;
        }

        if (game.playerTokens !== null && game.opponentTokens !== null) {
            // do the calculation logic

            res.status(200);
            res.send(GameStatus.GAME_COMPLETE);
        } else {
            res.status(200);
            res.send(GameStatus.TOKENS_SENT);
        }
    }
}