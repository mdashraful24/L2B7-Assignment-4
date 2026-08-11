import { catchAsyncUtil } from "../../utils/catchAsync";

const createContact = catchAsyncUtil(async (req, res) => {

});

const allContacts = catchAsyncUtil(async (req, res) => {

});


export const contactController = {
    createContact,
    allContacts,
};