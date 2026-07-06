import httpStatus from 'http-status';
import { catchAsyncUtil } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { serviceServices } from "./service.service";
import { SelfError } from '../../utils/errorResponse';

const createService = catchAsyncUtil(async (req, res) => {
    const technicianId = req.user?.id;

    const result = await serviceServices.createServiceIntoDB(technicianId as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Service created successfully",
        data: result,
    });
});

const allServicesWithFilter = catchAsyncUtil(async(req, res)=>{
    const query = req.query;

    const result = await serviceServices.getAllServicesWithFilter(query);

    if (result.data.length === 0) {
        throw new SelfError("No services found", httpStatus.NOT_FOUND);
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Services retrieved successfully",
        data: result.data,
        meta: result.meta
    });
});

const singleService = catchAsyncUtil(async(req, res)=>{
    const {id} = req.params;

    if(!id){
        throw new SelfError("Service ID is required", httpStatus.BAD_REQUEST);
    }

    const result = await serviceServices.getSingleService(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Service details retrieved successfully",
        data: result
    });
});

// const allServiceCategories = catchAsyncUtil(async(req, res)=>{

// });


export const serviceController = {
    createService,
    allServicesWithFilter,
    singleService,
    // allServiceCategories,
};