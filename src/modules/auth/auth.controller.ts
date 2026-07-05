import httpStatus from 'http-status';
import { catchAsyncUtil } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { authService } from "./auth.service";

const registerUser = catchAsyncUtil(async (req, res) => {
    const result = await authService.registerUserIntoDB(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User registered successfully",
        data: result
    });
});

const loginUser = catchAsyncUtil(async (req, res) => {
    const result = await authService.loginUserIntoDB(req.body);

    const { accessToken, refreshToken } = result;

    res.cookie("access-token", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24      // * 24 hours or 1 day
    });

    res.cookie("refresh-token", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7        // * 7 days
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User logged in successfully",
        data: result
    });
});

const authRefreshToken = catchAsyncUtil(async (req, res) => {
    const refreshToken = req.cookies["refresh-token"];

    const { accessToken } = await authService.authRefreshTokenIntoDB(refreshToken);

    res.cookie("access-token", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24      // * 24 hours or 1 day
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Token refreshed successfully",
        data: { accessToken }
    });
});

const getMe = catchAsyncUtil(async(req, res)=>{
    const result = await authService.getMeFromDB(req.user?.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile retrieved successfully",
        data: result,
    });
});


export const authController = {
    registerUser,
    loginUser,
    authRefreshToken,
    getMe
};