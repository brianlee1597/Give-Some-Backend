import mongoose from "mongoose";

interface GameSchema {
  timestamp: {
    type: string;
  };
  status: {
    type: string;
    required: boolean;
  };
  playerID: {
    type: string;
    required: boolean;
  };
  opponentID: {
    type: string;
    default: null;
  };
  playerTokens: {
    type: any;
    required: boolean;
  };
  opponentTokens: {
    type: any;
    default: null;
  };
}

const gameSchema: GameSchema = {
  timestamp: {
    type: "number",
  },
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
    type: {
      available: "number",
      given: "number",
    },
    required: true,
  },
  opponentTokens: {
    type: {
      available: "number",
      given: "number",
    },
    default: null,
  },
};

const Game = mongoose.model("Game", new mongoose.Schema(gameSchema));
export default Game;
