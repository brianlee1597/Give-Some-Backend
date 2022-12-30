import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Account, { validate as accountValidate } from "../models/account";
import { hash } from "../helpers";

export default class AccountService {
    public async create(req: Request, res: Response) {
        const accountCreationForm = req.body;

        const { error: accountValidationError } 
            = accountValidate(accountCreationForm);
    
        if (accountValidationError) {
            res.status(400);
            res.send(accountValidationError.details[0].message);
            return;
        }

        let {
            name,
            email,
            password
        } = accountCreationForm;

        const accountExists = await Account.findOne({ email });

        if (accountExists) {
            res.status(400);
            res.send("email already exists");
            return;
        }

        password = await hash(password);

        const account = new Account({
            name,
            email,
            password,
            token_count: 4
        })

        account.save((mongooseSaveError) => {
            if (mongooseSaveError) {
                res.status(400);
                res.send(mongooseSaveError);
                return;
            }
            
            res.status(200);
            res.send("account creation successful");
        })
    }

    public async login (req: Request, res: Response) {
        const email = req.body.email;
        const password = req.body.password;

        const account = await Account.findOne({ email });

        if (!account) {
            res.status(400);
            res.send("no account found with that email, cannot login");
            return;
        }

        const hash = account.password as unknown as string;
        const isMatch = await bcrypt.compare(password, hash);

        const status = isMatch ? 200 : 400;
        const message = isMatch ? "login successful" :
            "login failed, no matching password for that email";

        res.status(status);
        res.send(message);
    }

    public async delete (req: Request, res: Response) {
        const email = req.body.email;
        const account = await Account.findOne({ email });

        if (!account) {
            res.status(400);
            res.send("no account found with that email, cannot delete");
            return;
        }

        account.delete((deleteError) => {
            if (deleteError) {
                res.status(400);
                res.send(deleteError);
            }

            res.status(200)
            res.send("account deletion complete");
        })
    }
}