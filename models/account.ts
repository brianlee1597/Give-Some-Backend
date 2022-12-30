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

interface Password {
    type: string;
    required: boolean;
    unique: boolean;
}

interface TokenCount { 
    type: string, 
    required: boolean,
};

interface AccountSchema {
    name: AccountKeyConfig;
    email: AccountKeyConfig;
    password: Password;
    token_count: TokenCount;
}

const accountSchema: AccountSchema = {
    name: {
        type: "string",
        required: true,
        minlength: 1,
        maxlength: 50
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
        unique: true 
    },
    token_count: { 
        type: "number", 
        required: true
    }
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