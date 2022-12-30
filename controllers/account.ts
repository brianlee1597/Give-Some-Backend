import express from "express";
import AccountService from "../services/AccountService";

const router = express.Router();
const account = new AccountService();

router.post("/create_account", account.create);
router.post("/delete_account", account.delete);
router.post("/login", account.login);

export default router;