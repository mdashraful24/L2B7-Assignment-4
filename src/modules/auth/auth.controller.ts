import httpStatus from 'http-status';
import { catchAsyncUtil } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { authService } from "./auth.service";
import { SelfError } from '../../utils/errorResponse';

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

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24      // * 24 hours or 1 day
    });

    res.cookie("refreshToken", refreshToken, {
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

const googleLogin = catchAsyncUtil(async(req, res)=>{
    const payload = req.body;

    const result = await authService.googleLoginIntoDB(payload);

    const { accessToken, refreshToken } = result;

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24      // * 24 hours or 1 day
    });

    res.cookie("refreshToken", refreshToken, {
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
    const refreshToken = req.cookies["refreshToken"];

    const { accessToken } = await authService.authRefreshTokenIntoDB(refreshToken);

    res.cookie("accessToken", accessToken, {
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

const getMe = catchAsyncUtil(async (req, res) => {
    const result = await authService.getMeFromDB(req.user?.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile retrieved successfully",
        data: result,
    });
});

const updateMe = catchAsyncUtil(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new SelfError("User not authenticated", httpStatus.UNAUTHORIZED);
    }

    const result = await authService.updateMeFromDB(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile updated successfully",
        data: result,
    });
});


export const authController = {
    registerUser,
    loginUser,
    googleLogin,
    authRefreshToken,
    getMe,
    updateMe
};