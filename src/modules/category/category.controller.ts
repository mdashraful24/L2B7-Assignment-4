import httpStatus from 'http-status';
import { catchAsyncUtil } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { categoryServices } from './category.service';

const allServiceCategories = catchAsyncUtil(async (req, res) => {
    const result = await categoryServices.getAllServiceCategories(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Categories retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});


export const categoryController ={
    allServiceCategories,
};