import httpStatus from 'http-status';
import { RequestHandler } from "express";
import { sendResponse } from "./sendResponse";
import { errorHandle } from "./errorResponse";

export const catchAsyncUtil = (fn: RequestHandler): RequestHandler => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            const err = errorHandle(error);

            sendResponse(res, {
                statusCode: err.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
                success: false,
                message: err.message,
                // error: err,
            });
        }
    };
} ;