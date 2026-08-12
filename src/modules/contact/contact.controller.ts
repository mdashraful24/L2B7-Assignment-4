import { catchAsyncUtil } from "../../utils/catchAsync";
import { contactService } from "./contact.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createContact = catchAsyncUtil(async (req, res) => {
    const result = await contactService.createContactDB(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Contact created successfully",
        data: result
    });
});

const allContacts = catchAsyncUtil(async (req, res) => {
    const result = await contactService.getAllContacts(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Contacts retrieved successfully",
        data: result.data,
        meta: result.meta
    });
});

const singleContact = catchAsyncUtil(async (req, res) => {
    const result = await contactService.singleContact(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Contact retrieved successfully",
        data: result
    });
});


export const contactController = {
    createContact,
    allContacts,
    singleContact,
};
