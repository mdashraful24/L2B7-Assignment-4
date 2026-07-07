import httpStatus from 'http-status';
import { catchAsyncUtil } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { reviewServices } from "./review.service";

const createReview = catchAsyncUtil(async (req, res) => {
    const customerId = req.user?.id as string;

    const result = await reviewServices.createReviewIntoDB(customerId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Review created successfully",
        data: result,
    });
});


export const reviewController = {
    createReview,
};