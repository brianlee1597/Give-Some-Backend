import express from "express";
import { verifyJWT } from "../helpers";
import GameService from "../services/GameService";

const router = express.Router();

router.get("/leaderboard", verifyJWT, GameService.leaderboard);
router.get("/get_arena", verifyJWT, GameService.getArena);
router.get("/game_stats", verifyJWT, GameService.getGameStats);
router.get("/final_results", verifyJWT, GameService.getFinalResults);

router.post("/join", verifyJWT, GameService.join);
router.post("/send_tokens", verifyJWT, GameService.sendTokens);

export default router;
