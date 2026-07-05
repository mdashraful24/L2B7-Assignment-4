import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from "./config";

const app: Application = express();

// Middlewares
app.use(cors({
    origin: config.appUrl,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// All Routes
app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");
});


export default app;