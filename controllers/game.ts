import express from "express";
import GameService from "../services/GameService";

const router = express.Router();
const game = new GameService();

router.get("/leaderboard", game.leaderboard);
router.get("/get_arena", game.getGameArena);

router.post("/join", game.join);
router.post("/send_tokens", game.sendTokens);

export default router;