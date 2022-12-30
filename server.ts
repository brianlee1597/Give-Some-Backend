import * as dotenv from 'dotenv';
import express from "express";
import mongoose from "mongoose";
import account from "./controllers/account";
import game from "./controllers/game";

dotenv.config();

/* =========== MONGODB ATLAS SETUP ========== */
const user = process.env.MONGODB_USERNAME! as string;
const pass = process.env.MONGODB_PASSWORD! as string;
const connectionStr = `mongodb+srv://${user}:${pass}@cluster0.1gjphmf.mongodb.net/?retryWrites=true&w=majority`;

mongoose.set("strictQuery", false);
mongoose.connect(connectionStr)
.then(() => console.log('mongodb connected'));
/* =========== MONGODB ATLAS SETUP ========== */

/* =========== EXPRESS SETUP ========== */
const port = 8888;
const app = express();

app.use(express.json());
app.use('/', account);
app.use('/', game);

app.listen(port, () => {
    console.log(`server running @ port: ${port}`);
})
/* =========== EXPRESS SETUP ========== */