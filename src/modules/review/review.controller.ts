import httpStatus from 'http-status';
import { catchAsyncUtil } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { reviewServices } from "./review.service";
import { SelfError } from '../../utils/errorResponse';

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

const updateReview = catchAsyncUtil(async (req, res) => {
    const customerId = req.user?.id as string;
    const { id } = req.params;

    if (!id) {
        throw new SelfError("Review ID is required", httpStatus.BAD_REQUEST);
    }

    const result = await reviewServices.updateReviewFromDB(customerId, id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review updated successfully",
        data: result,
    });
});


export const reviewController = {
    createReview,
    updateReview
};