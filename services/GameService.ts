import { Request, Response } from "express";
import Account from "../models/account";
import { Status } from "./__global_enums";

export default class GameService {

    public async leaderboard (_: Request, res: Response) {
        const leaderboard = await Account
            .find()
            .sort({ token_count: -1 })
            .limit(100);

        const necessaryInfo = leaderboard.map((schema: any) => {
            const nickname = schema.nickname;
            const token_count = schema.token_count;

            return { 
                nickname, 
                token_count 
            };
        })

        res.status(Status.GOOD_REQUEST);
        res.send(necessaryInfo);
    }

    public async join (req: Request, res: Response) {
        
    }
}