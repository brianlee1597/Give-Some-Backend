import Joi from "joi";
import mongoose from "mongoose";

/* ========== MongoDB Schema Modeling ========== */
interface AccountKeyConfig {
    type: string;
    required: boolean;
    minlength: number;
    maxlength: number;
    unique?: boolean;
}

interface Encrypted {
    data: { type: string },
    iv: { type: string },
}

interface AccountSchema {
    name: AccountKeyConfig;
    email: AccountKeyConfig;
    password: Encrypted;
    token_count: { type: string, required: boolean };
}

const accountKey = (
    type: string, 
    required: boolean, 
    minlength: number, 
    maxlength: number,
    unique?: boolean,
): AccountKeyConfig => {
    return { type, required, minlength, maxlength, unique };
}

const accountSchema: AccountSchema = {
    name: accountKey("string", true, 1, 50),
    email: accountKey("string", true, 5, 255, true),
    token_count: { type: "number", required: true },
    password: {
        data: { type: "string" },
        iv: { type: "string" },
    },
}

const Account = mongoose.model("Account", new mongoose.Schema(accountSchema));
export default Account;
/* ========== MongoDB Schema Modeling ========== */

/* ========== Account Creation JSON Validation ========== */
interface AccountBody {
    name: string;
    email: string;
    password: string;
}

const validate = (body: AccountBody) => {
    const account = Joi.object({
        name: Joi
            .string()
            .min(1)
            .max(50)
            .required(),

        email: Joi
            .string()
            .min(5)
            .max(255)
            .required()
            .email(),

        password: Joi
            .string()
            .min(3)
            .max(30)
            .required()
    });

    return account.validate(body);
}

export { validate };
/* ========== Account Creation JSON Validation ========== */