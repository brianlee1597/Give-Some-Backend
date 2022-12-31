import express from "express";
import AccountService from "../services/AccountService";

const router = express.Router();

router.post("/create_account", AccountService.createAccount);
router.post("/delete_account", AccountService.deleteAccount);
router.post("/login", AccountService.login);

export default router;
