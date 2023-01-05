import * as dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import account from "./controllers/account";
import game from "./controllers/game";
import { verifyJWT } from "./config";
import WebSocket from "ws";
import jwt from "jsonwebtoken";
import { getArenaWebSocketInfo } from "./controllers/game/services/arena";

dotenv.config();

const connectionStr = process.env.MONGO_URI! as string;
mongoose.set("strictQuery", false);
mongoose.connect(connectionStr).then(() => console.log("database connected"));

const port = 8888;
const app = express();

const wss = new WebSocket.Server({ server: app as any });
wss.on("connection", game.arena);

app.use(express.json());
app.use(morgan("tiny"));

app.get("/leaderboard", game.leaderboard);
app.post("/create_account", account.createAccount);
app.post("/login", account.login);

app.post("/delete_account", verifyJWT, account.deleteAccount);
app.post("/join_game", verifyJWT, game.joinGame);
app.get("/arena_ws_info", verifyJWT, getArenaWebSocketInfo);
app.post("/send_tokens", verifyJWT, game.sendTokens);

app.listen(port, () => {
  console.log(`server running at port: ${port}`);
});
