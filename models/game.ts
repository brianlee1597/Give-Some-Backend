import mongoose from "mongoose"

/* ========== MongoDB Schema Modeling ========== */
interface GameSchema {
    status: {
        type: string,
        required: boolean,
    },
    playerID: {
        type: string,
        required: boolean,
    },
    opponentID: {
        type: string,
        default: null,
    },
    playerTokens: {
        type: string,
        default: null,
    },
    opponentTokens: {
        type: string,
        default: null,
    },
}

const gameSchema: GameSchema = {
    status: {
        type: "number",
        required: true,
    },
    playerID: {
        type: "string",
        required: true,
    },
    opponentID: {
        type: "string",
        default: null,
    },
    playerTokens: {
        type: "number",
        default: null,
    },
    opponentTokens: {
        type: "number",
        default: null,
    }
}

const Game = mongoose.model("Game", new mongoose.Schema(gameSchema));
export default Game;
/* ========== MongoDB Schema Modeling ========== */