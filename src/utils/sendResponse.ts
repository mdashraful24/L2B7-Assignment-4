import { Response } from "express";

type TMeta = {
    page: number;
    limit: number;
    total: number;
}

type IResponse<T, E> = {
    statusCode: number;
    success: boolean;
    message?: string;
    data?: T;
    error?: E;
    author?: string;
    meta?: TMeta
}

export const sendResponse = <T, E>(res: Response, resData: IResponse<T, E>) => {
    res.status(resData.statusCode).json({
        success: resData.success,
        message: resData.message,
        data: resData.data,
        error: resData.error,
        author: resData.author,
        meta: resData.meta
    });
};