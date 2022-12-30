import Account, { validate as accountValidate } from "../models/account";
import { encrypt } from "../helpers";

export default class AccountService {
    private DEFAULT_TOKEN_COUNT: number;

    constructor () {
        this.DEFAULT_TOKEN_COUNT = 4;
    }

    public async create(req: any, res: any) {
        const accountCreationForm = req.body;
        const { error: accountValidationError } 
            = accountValidate(accountCreationForm);
    
        if (accountValidationError) {
            res.status(400);
            res.send(accountValidationError.details[0].message);
            return;
        }

        const {
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

        const account = new Account({
            name,
            email,
            password: encrypt(password),
            token_count: this.DEFAULT_TOKEN_COUNT,
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
}