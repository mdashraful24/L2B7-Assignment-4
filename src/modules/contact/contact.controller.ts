import { catchAsyncUtil } from "../../utils/catchAsync";
import { contactService } from "./contact.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createContact = catchAsyncUtil(async (req, res) => {
    const userId = req.user?.id;

    const result = await contactService.createContactDB(userId as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Contact created successfully",
        data: result,
    });
});

const myContacts = catchAsyncUtil(async (req, res) => {
    const userId = req.user?.id as string;

    const result = await contactService.getMyContacts(
        userId,
        req.query
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Your contacts retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const allContacts = catchAsyncUtil(async (req, res) => {
    const result = await contactService.getAllContacts(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Contacts retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const singleContact = catchAsyncUtil(async (req, res) => {
    const result = await contactService.singleContact(
        req.params.id as string
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Contact retrieved successfully",
        data: result,
    });
});

const replyContact = catchAsyncUtil(async (req, res) => {
    const userId = req.user?.id as string;

    const result = await contactService.replyContact(
        req.params.id as string,
        req.body,
        userId
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reply sent successfully",
        data: result,
    });
});

export const contactController = {
    createContact,
    myContacts,
    allContacts,
    singleContact,
    replyContact,
};
