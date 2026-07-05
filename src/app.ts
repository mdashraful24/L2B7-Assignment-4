import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from "./config";
import { authRoutes } from "./modules/auth/auth.route";

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

app.use("/api/auth/", authRoutes);


export default app;