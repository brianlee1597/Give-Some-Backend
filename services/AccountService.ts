import { createEthAccount } from "../overledger";
import Account, { validate as accountValidate } from "../models/account";
import { encrypt } from "../helpers";

export default class AccountService {
    public async create (req: any, res: any) {
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
    
        const { data: newEthereumAccount, error: createEthAccountError } 
            = await createEthAccount();
    
        if (createEthAccountError) {
            res.status(400);
            res.send(createEthAccountError);
            return;
        }
    
        const { privateKey, address } = newEthereumAccount;

        const account = new Account({
            name,
            email,
            address,
            password: encrypt(password),
            privateKey: encrypt(privateKey),
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