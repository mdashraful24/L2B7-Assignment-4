import httpStatus from 'http-status';
import { catchAsyncUtil } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { bookingServices } from "./booking.service";

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
    const userRole = req.user?.role as string;
    
    const result = await bookingServices.getAllBooking(userId, userRole);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bookings retrieved successfully",
        data: result,
    });
});

const singleBookingDetails = catchAsyncUtil(async (req, res) => {
    const userId = req.user?.id as string;
    const userRole = req.user?.role as string;
    const { id } = req.params;

    const result = await bookingServices.getSingleBooking(userId, userRole, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Booking details retrieved successfully",
        data: result,
    });
});

const updateBooking = catchAsyncUtil(async (req, res) => {
    const userId = req.user?.id as string;
    const userRole = req.user?.role as string;
    const { id } = req.params;

    const result = await bookingServices.updateBookingFromDB(userId, userRole, id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Booking updated successfully",
        data: result,
    });
});

const deleteBooking = catchAsyncUtil(async (req, res) => {
    const userId = req.user?.id as string;
    const userRole = req.user?.role as string;
    const { id } = req.params;

    const result = await bookingServices.deleteBookingFromBD(userId, userRole, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Booking deleted successfully",
        data: result,
    });
});

export const bookingController = {
    createBooking,
    allBooking,
    singleBookingDetails,
    updateBooking,
    deleteBooking
};