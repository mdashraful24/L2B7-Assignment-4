import httpStatus from 'http-status';
import { Request, Response } from "express";

export const routeNotFound = (req: Request, res: Response)=>{
    res.status(httpStatus.NOT_FOUND).json({
        message: "This route not found",
        path: req.originalUrl,
        data: Date()
    });
};