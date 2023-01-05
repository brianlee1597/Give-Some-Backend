import mongoose from "mongoose";

/* ========== MongoDB Schema Modeling ========== */
interface AccountKeyConfig {
  type: string;
  required: boolean;
  minlength: number;
  maxlength: number;
  unique?: boolean;
}

interface Password {
  type: string;
  required: boolean;
}

interface TokenCount {
  type: string;
  required: boolean;
}

export interface AccountSchema {
  nickname: AccountKeyConfig;
  email: AccountKeyConfig;
  password: Password;
  token_count: TokenCount;
}

const accountSchema: AccountSchema = {
  nickname: {
    type: "string",
    required: true,
    minlength: 1,
    maxlength: 50,
    unique: true,
  },
  email: {
    type: "string",
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: "string",
    required: true,
  },
  token_count: {
    type: "number",
    required: true,
  },
};

const Account = mongoose.model("Account", new mongoose.Schema(accountSchema));
export default Account;
/* ========== MongoDB Schema Modeling ========== */
