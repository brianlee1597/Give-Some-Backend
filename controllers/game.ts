import express from "express";
import GameService from "../services/GameService";

const router = express.Router();
const game = new GameService();

router.get("/leaderboard", game.leaderboard);

export default router;