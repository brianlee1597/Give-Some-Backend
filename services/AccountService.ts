import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { Filter } from 'profanity-check';
import Account, { validate as accountValidate } from "../models/account";
import { hash } from "../helpers";
import { Status } from "./__global_enums";

enum AccountError {
    PROFANE_NICKNAME = "please choose a less profane nickname",
    NICKNAME_EXISTS = "nickname already exists, please choose another nickname",
    EMAIL_EXISTS = "email already exists",
    NO_ACCOUNT_FOUND = "no account found with that email",
    NO_MATCHING_PASSWORD = "no matching password for that email",
}

export default class AccountService {
    public async create(req: Request, res: Response) {
        const accountCreationForm = req.body;

        const { error: accountValidationError } 
            = accountValidate(accountCreationForm);
    
        if (accountValidationError) {
            res.status(Status.BAD_REQUEST);
            res.send(accountValidationError.details[0].message);
            return;
        }

        let {
            nickname,
            email,
            password
        } = accountCreationForm;

        const filter = new Filter();
        const profaneNickname = filter.isProfane(nickname);

        if (profaneNickname) {
            res.status(Status.BAD_REQUEST);
            res.send(AccountError.PROFANE_NICKNAME);
        }

        const nameExists = await Account.findOne({ nickname });
        const accountExists = await Account.findOne({ email });

        if (nameExists) {
            res.status(Status.BAD_REQUEST);
            res.send(AccountError.NICKNAME_EXISTS);
            return;
        }

        if (accountExists) {
            res.status(Status.BAD_REQUEST);
            res.send(AccountError.EMAIL_EXISTS);
            return;
        }

        const newAccount = new Account({
            nickname,
            email,
            password: await hash(password),
            token_count: 4
        })

        newAccount.save((mongooseSaveError) => {
            if (mongooseSaveError) {
                res.status(Status.BAD_REQUEST);
                res.send(mongooseSaveError);
                return;
            }
            
            res.status(Status.GOOD_REQUEST);
            res.send("account creation successful");
        })
    }

    public async login (req: Request, res: Response) {
        const email = req.body.email;
        const password = req.body.password;

        const account = await Account.findOne({ email });

        if (!account) {
            res.status(Status.BAD_REQUEST);
            res.send(AccountError.NO_ACCOUNT_FOUND);
            return;
        }

        const hash = account.password as unknown as string;
        const isMatch = await bcrypt.compare(password, hash);

        const status = isMatch ? Status.GOOD_REQUEST : Status.BAD_REQUEST;
        const message = isMatch ? "login successful" :
            AccountError.NO_MATCHING_PASSWORD;

        res.status(status);
        res.send(message);
    }

    public async delete (req: Request, res: Response) {
        const email = req.body.email;
        const account = await Account.findOne({ email });

        if (!account) {
            res.status(Status.BAD_REQUEST);
            res.send(AccountError.NO_ACCOUNT_FOUND);
            return;
        }

        account.delete((deleteError) => {
            if (deleteError) {
                res.status(Status.BAD_REQUEST);
                res.send(deleteError);
            }

            res.status(Status.GOOD_REQUEST)
            res.send("account deletion complete");
        })
    }
}