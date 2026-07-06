import { catchAsyncUtil } from "../../utils/catchAsync";

const createBooking = catchAsyncUtil(async(req, res)=>{

});

const allBooking = catchAsyncUtil(async(req, res)=>{

});

const singleBookingDetails = catchAsyncUtil(async(req, res)=>{

});

const updateBooking = catchAsyncUtil(async(req, res)=>{

});

const deleteBooking = catchAsyncUtil(async(req, res)=>{

});


export const bookingController = {
    createBooking,
    allBooking,
    singleBookingDetails,
    updateBooking,
    deleteBooking
};