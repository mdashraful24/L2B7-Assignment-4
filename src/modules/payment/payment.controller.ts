import httpStatus from 'http-status';
import { catchAsyncUtil } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentServices } from "./payment.service";

const createIntent = catchAsyncUtil(async (req, res) => {
    const userId = req.user?.id;
    const { bookingId } = req.body;

    const result = await paymentServices.createIntentIntoStripe(userId as string, bookingId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment session created successfully",
        data: result
    });
});

const paymentConfirm = catchAsyncUtil(async (req, res) => {
    const { sessionId, paymentIntentId } = req.body;

    const result = await paymentServices.createPaymentConfirmation({ sessionId, paymentIntentId });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment confirmed successfully",
        data: result,
    });
});

const stripeWebhook = catchAsyncUtil(async (req, res) => {
    const payload = req.body as Buffer;
    const signature = req.headers['stripe-signature'] as string;

    await paymentServices.handleWebhook(payload, signature);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Webhook processed successfully",
        data: null
    });
});

const paymentHistory = catchAsyncUtil(async (req, res) => {
    const userId = req.user?.id as string;

    const result = await paymentServices.getPaymentHistory(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment history retrieved successfully",
        data: result,
    });
});

const paymentDetails = catchAsyncUtil(async (req, res) => {
    const userId = req.user?.id as string;
    const { id } = req.params;

    const result = await paymentServices.getPaymentDetails(userId, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment details retrieved successfully",
        data: result,
    });
});

export const paymentController = {
    createIntent,
    paymentConfirm,
    stripeWebhook,
    paymentHistory,
    paymentDetails
};