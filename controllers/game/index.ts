import arena, { getArenaWebSocketInfo } from "./services/arena";
import getFinalResults from "./services/getFinalResults";
import joinGame from "./services/joinGame";
import leaderboard from "./services/leaderboard";
import sendTokens from "./services/sendTokens";

export default {
  leaderboard,
  joinGame,
  arena,
  getArenaWebSocketInfo,
  sendTokens,
  getFinalResults,
};
