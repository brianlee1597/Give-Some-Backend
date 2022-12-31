import express from "express";
import { verifyJWT } from "../helpers";
import AccountService from "../services/AccountService";

const router = express.Router();

router.post("/create_account", AccountService.createAccount);
router.post("/delete_account", verifyJWT, AccountService.deleteAccount);
router.post("/login", AccountService.login);

export default router;
