import httpStatus from 'http-status';
import { catchAsyncUtil } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { technicianService } from "./tech.service";
import { SelfError } from '../../utils/errorResponse';

const allTechnician = catchAsyncUtil(async (req, res) => {
    const query = req.query;

    const result = await technicianService.getAllTechnician(query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Technicians retrieved successfully",
        data: result.data,
        meta: result.meta
    });
});

const singleTechnician = catchAsyncUtil(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new SelfError("Technician ID is required", httpStatus.BAD_REQUEST);
    }

    const result = await technicianService.getSingleTechnician(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Technician profile with reviews retrieved successfully",
        data: result
    });
});

const updateTechProfile = catchAsyncUtil(async (req, res) => {
    const technicianId = req.user?.id as string

    const result = await technicianService.updateProfileFromDB(technicianId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Technician profile updated successfully!",
        data: result
    });
});

const createAvailabilitySlot = catchAsyncUtil(async (req, res) => {
    const technicianId = req.user?.id as string;

    const result = await technicianService.createAvailabilitySlotIntoDB(technicianId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Availability slot created successfully",
        data: result
    });
});

const updateAvailabilitySlot = catchAsyncUtil(async (req, res) => {
    const technicianId = req.user?.id as string;

    const result = await technicianService.updateAvailabilitySlotFromDB(technicianId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Availability slot updated successfully",
        data: result
    });
});

const techniciansBookings = catchAsyncUtil(async (req, res) => {
    const technicianId = req.user?.id as string;

    const result = await technicianService.getTechniciansBookings(technicianId, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Technician bookings retrieved successfully",
        data: result.data,
        meta: result.meta
    });
});

const updateBookingStatus = catchAsyncUtil(async (req, res) => {
    const technicianId = req.user?.id as string;
    const { id } = req.params;

    const result = await technicianService.updateBookingStatusFromDB(technicianId, id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Booking status updated successfully",
        data: result
    });
});


export const technicianController = {
    allTechnician,
    singleTechnician,
    updateTechProfile,
    createAvailabilitySlot,
    updateAvailabilitySlot,
    techniciansBookings,
    updateBookingStatus
};