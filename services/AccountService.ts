import AccountBasic, { validate as accountBasicValidate } from "../models/account_basic";
import { encrypt } from "../helpers";

export default class AccountService {
    public async create(req: any, res: any) {
        const accountCreationForm = req.body;
        const { error: accountValidationError } 
            = accountBasicValidate(accountCreationForm);
    
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

        const accountExists = await AccountBasic.findOne({ email });

        if (accountExists) {
            res.status(400);
            res.send("email already exists");
            return;
        }

        const account = new AccountBasic({
            name,
            email,
            password: encrypt(password),
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