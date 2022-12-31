import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { Filter } from 'profanity-check';
import Account, { AccountBody, validate } from "../models/account";
import { hash } from "../helpers";
import { Status } from "./__global_enums";
import { ValidationError } from "joi";

export enum AccountError {
    PROFANE_NICKNAME = "please choose a less profane nickname",
    NICKNAME_EXISTS = "nickname already exists, please choose another nickname",
    EMAIL_EXISTS = "email already exists",
    NO_ACCOUNT_FOUND = "no account found with that email",
    NO_MATCHING_PASSWORD = "no matching password for that email",
}

export default class AccountService {

    public async create(req: Request, res: Response): Promise<void> {
        const accountCreationForm: AccountBody = req.body;

        const { error: accountValidationError }: { error: ValidationError | undefined }
            = validate(accountCreationForm);
    
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

        const filter: Filter = new Filter();
        const profaneNickname: boolean = filter.isProfane(nickname);

        if (profaneNickname) {
            res.status(Status.BAD_REQUEST);
            res.send(AccountError.PROFANE_NICKNAME);
            return;
        }

        const nameExists: any = await Account.findOne({ nickname });
        const accountExists: any = await Account.findOne({ email });

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

        const newAccount: any = new Account({
            nickname,
            email,
            password: await hash(password),
            token_count: 4
        })

        newAccount.save((mongooseSaveError: any) => {
            if (mongooseSaveError) {
                res.status(Status.BAD_REQUEST);
                res.send(mongooseSaveError);
                return;
            }
            
            res.status(Status.GOOD_REQUEST);
            res.send("account creation successful");
        })
    }

    public async login (req: Request, res: Response): Promise<void> {
        const email: string = req.body.email;
        const password: string = req.body.password;

        const account: any = (await Account.findOne({ email }));

        if (!account) {
            res.status(Status.BAD_REQUEST);
            res.send(AccountError.NO_ACCOUNT_FOUND);
            return;
        }

        const isMatch: boolean = await bcrypt.compare(password,  account.password);

        const status: Partial<Status> = isMatch ? Status.GOOD_REQUEST : Status.BAD_REQUEST;
        const message: Partial<Status> | string = isMatch ? "login successful" :
            AccountError.NO_MATCHING_PASSWORD;

        res.status(status);
        res.send(message);
    }

    public async delete (req: Request, res: Response): Promise<void> {
        const email: string = req.body.email;
        const account: any = await Account.findOne({ email });

        if (!account) {
            res.status(Status.BAD_REQUEST);
            res.send(AccountError.NO_ACCOUNT_FOUND);
            return;
        }

        account.delete((deleteError: any) => {
            if (deleteError) {
                res.status(Status.BAD_REQUEST);
                res.send(deleteError);
                return;
            }

            res.status(Status.GOOD_REQUEST)
            res.send("account deletion complete");
        })
    }
}