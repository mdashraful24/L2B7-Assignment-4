import httpStatus from 'http-status';
import { catchAsyncUtil } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { bookingServices } from "./booking.service";
import { SelfError } from '../../utils/errorResponse';

const createBooking = catchAsyncUtil(async (req, res) => {
    const customerId = req.user?.id as string;

    const result = await bookingServices.createBookingIntoDB(customerId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Booking created successfully",
        data: result,
    });
});

const allBooking = catchAsyncUtil(async (req, res) => {
    const userId = req.user?.id as string;

    const result = await bookingServices.getAllBooking(userId);

    if (result.length === 0) {
        throw new SelfError("No bookings available", httpStatus.NOT_FOUND);
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bookings retrieved successfully",
        data: result,
    });
});

const singleBookingDetails = catchAsyncUtil(async (req, res) => {
    const userId = req.user?.id as string;
    const { id } = req.params;

    const result = await bookingServices.getSingleBooking(userId, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Booking details retrieved successfully",
        data: result,
    });
});

const updateBooking = catchAsyncUtil(async (req, res) => {
    const userId = req.user?.id as string;
    const { id } = req.params;

    const result = await bookingServices.updateBookingFromDB(userId, id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Booking updated successfully",
        data: result,
    });
});

const updateBookingStatus = catchAsyncUtil(async (req, res) => {
    const userId = req.user?.id as string;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        throw new SelfError("Status is required", httpStatus.BAD_REQUEST);
    }

    const result = await bookingServices.updateBookingStatusFromDB(userId, id as string, status);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Booking status updated successfully",
        data: result,
    });
});


export const bookingController = {
    createBooking,
    allBooking,
    singleBookingDetails,
    updateBooking,
    updateBookingStatus,
};