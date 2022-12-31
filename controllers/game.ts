import express from "express";
import GameService from "../services/GameService";

const router = express.Router();

router.get("/leaderboard", GameService.leaderboard);
router.get("/get_arena", GameService.getArena);

router.post("/join", GameService.join);
router.post("/send_tokens", GameService.sendTokens);

export default router;
