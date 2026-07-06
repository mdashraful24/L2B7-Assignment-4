import httpStatus from "http-status";
import { catchAsyncUtil } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { adminServices } from "./admin.service";
import { SelfError } from "../../utils/errorResponse";

const createServiceCategory = catchAsyncUtil(async (req, res) => {
    const result = await adminServices.createServiceCategoryIntoDB(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Category created successfully",
        data: result,
    });
});

const getAllUsers = catchAsyncUtil(async (req, res) => {
    const result = await adminServices.getAllUsersFromDB(req.query);

    if (result.data.length === 0) {
        throw new SelfError("No users found", httpStatus.NOT_FOUND);
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Users retrieved successfully",
        data: result.data,
        meta: result.meta
    });
});

const updateUserStatus = catchAsyncUtil(async (req, res) => {
    const { id } = req.params;

    const result = await adminServices.updateUserStatusIntoDB(id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User status updated successfully",
        data: result,
    });
});

const getAllBookings = catchAsyncUtil(async (req, res) => {
    const result = await adminServices.getAllBookingsFromDB(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bookings retrieved successfully",
        data: result,
    });
});

const getAllCategories = catchAsyncUtil(async (req, res) => {
    const result = await adminServices.getAllCategoriesFromDB(req.query);

    if (result.data.length === 0) {
        throw new SelfError("No categories found", httpStatus.NOT_FOUND);
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Categories retrieved successfully",
        data: result.data,
        meta: result.meta
    });
});


export const adminController = {
    getAllUsers,
    updateUserStatus,
    getAllBookings,
    getAllCategories,
    createServiceCategory,
};