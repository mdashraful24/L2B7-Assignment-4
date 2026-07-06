import httpStatus from 'http-status';
import { catchAsyncUtil } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { technicianService } from "./tech.service";
import { SelfError } from '../../utils/errorResponse';

const allTechnician = catchAsyncUtil(async (req, res) => {
    const query = req.query;

    const result = await technicianService.getAllTechnician(query);

    if (result.data.length === 0) {
        throw new SelfError("No technicians found", httpStatus.NOT_FOUND);
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Technicians retrieved successfully",
        data: result.data,
        meta: result.meta
    });
});

const singleTechnician = catchAsyncUtil(async (req, res) => {
    const {id} = req.params;

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


export const technicianController = {
    allTechnician,
    singleTechnician
};