export enum Status {
  BAD_REQUEST = 400,
  BAD_AUTH = 401,
  GOOD_REQUEST = 200,
}

export enum ERROR {
  BAD_REQUEST_BODY = "check your request body for missing keys",
  PROFANE_NICKNAME = "please choose a less profane nickname",
  NICKNAME_EXISTS = "nickname already exists, please choose another nickname",
  EMAIL_EXISTS = "email already exists",
  NO_ACCOUNT_FOUND = "no account found with that email",
  NO_MATCHING_PASSWORD = "no matching password for that email",
  JWT_ERROR = "invalid JWT token for this operation",
  PLAYER_DOESNT_EXIST = "cannot join game, player doesn't exist.",
  GAME_NOT_FOUND = "game does not exist.",
  WRONG_ID = "you are not authorised to play in this game",
  ALREADY_COMPLETE = "game already finished, not authorised to send tokens",
  NOT_STARTED_YET = "game hasn't started yet, still looking for someone to join",
  BAD_AMOUNT = "invalid amount of tokens to give",
  INVALID_REQUEST = "invalid request",
}
