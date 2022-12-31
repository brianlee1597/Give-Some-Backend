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
}
