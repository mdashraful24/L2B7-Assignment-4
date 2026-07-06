import httpStatus from 'http-status';
import { catchAsyncUtil } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { categoryServices } from './category.service';
import { SelfError } from '../../utils/errorResponse';

const allServiceCategories = catchAsyncUtil(async (req, res) => {
    const result = await categoryServices.getAllServiceCategories(req.query);

    if (result.data.length === 0) {
        throw new SelfError("No categories found", httpStatus.NOT_FOUND);
    }

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
}