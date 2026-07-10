import { ErrorRequestHandler } from 'express';
import httpStatus from 'http-status';
import { SelfError } from '../utils/errorResponse';
import { Prisma } from '../../generated/prisma/client';

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
    // const err = errorHandle(error);

    // sendResponse(res, {
    //     statusCode: err.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
    //     success: false,
    //     message: err.message || "Something went wrong",
    //     // error: process.env.NODE_ENV === 'development' ? err : undefined,
    // });

    console.log("Error : ", error);

    let statusCode;
    let errorMessage = error.message || "Internal Server Error";
    let errorName = error.name || "Internal Server Error";

    // Handle Custom SelfError
    if (error instanceof SelfError) {
        statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = error.message;
        errorName = "Application Error";
    }
    // Handle Prisma Validation Errors
    else if (error instanceof Prisma.PrismaClientValidationError) {
        statusCode = httpStatus.BAD_REQUEST;
        errorMessage = "Invalid data provided. Please check your input fields.";
        errorName = "Validation Error";
    }
    // Handle Prisma Known Request Errors
    else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        errorName = "Database Error";

        switch (error.code) {
            case "P2000":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "The provided value for the column is too long for the column's type.";
                break;
            case "P2001":
                statusCode = httpStatus.NOT_FOUND;
                errorMessage = "The record searched for in the where condition does not exist.";
                break;
            case "P2002":
                statusCode = httpStatus.CONFLICT;
                errorMessage = `Duplicate entry: A record with this ${error.meta?.target || 'field'} already exists.`;
                break;
            case "P2003":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = `Foreign key constraint failed on the field: ${error.meta?.field_name || 'unknown field'}.`;
                break;
            case "P2004":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "A constraint failed on the database.";
                break;
            case "P2005":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = `The value ${error.meta?.field_value || 'provided'} for field ${error.meta?.field_name || 'unknown'} is invalid.`;
                break;
            case "P2006":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = `The provided value for ${error.meta?.field_name || 'field'} is not valid.`;
                break;
            case "P2007":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Data validation error in the database.";
                break;
            case "P2008":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Failed to parse the query.";
                break;
            case "P2009":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Failed to validate the query.";
                break;
            case "P2010":
                statusCode = httpStatus.INTERNAL_SERVER_ERROR;
                errorMessage = "Raw query failed.";
                break;
            case "P2011":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Null constraint violation on the field.";
                break;
            case "P2012":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Missing a required value.";
                break;
            case "P2013":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Missing a required argument.";
                break;
            case "P2014":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "The change you are trying to make would violate the required relation.";
                break;
            case "P2015":
                statusCode = httpStatus.NOT_FOUND;
                errorMessage = "A related record could not be found.";
                break;
            case "P2016":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Query interpretation error.";
                break;
            case "P2017":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "The records for relation are not connected.";
                break;
            case "P2018":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "The required connected records were not found.";
                break;
            case "P2019":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Input error in the query.";
                break;
            case "P2020":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Value out of range for the column type.";
                break;
            case "P2021":
                statusCode = httpStatus.INTERNAL_SERVER_ERROR;
                errorMessage = "The table does not exist in the current database.";
                break;
            case "P2022":
                statusCode = httpStatus.INTERNAL_SERVER_ERROR;
                errorMessage = "The column does not exist in the current database.";
                break;
            case "P2023":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Inconsistent column data.";
                break;
            case "P2024":
                statusCode = httpStatus.REQUEST_TIMEOUT;
                errorMessage = "Database operation timed out. Please try again.";
                break;
            case "P2025":
                statusCode = httpStatus.NOT_FOUND;
                errorMessage = "Record not found. The operation failed because required records were not found.";
                break;
            case "P2026":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "The current database provider doesn't support this feature.";
                break;
            case "P2027":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Multiple database errors occurred.";
                break;
            case "P2028":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Transaction API error.";
                break;
            case "P2029":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Query parameter limit exceeded.";
                break;
            case "P2030":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Cannot find a full text index to use for the search.";
                break;
            case "P2031":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "MongoDB: Prisma needs to perform transactions but the feature is not available.";
                break;
            case "P2033":
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = "Number out of range for the database provider.";
                break;
            case "P2034":
                statusCode = httpStatus.CONFLICT;
                errorMessage = "Transaction failed due to a write conflict or deadlock. Please retry.";
                break;
            default:
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = `Database error: ${error.message}`;
        }
    }
    // Handle Prisma Initialization Errors
    else if (error instanceof Prisma.PrismaClientInitializationError) {
        errorName = "Database Connection Error";

        if (error.errorCode === "P1000") {
            statusCode = httpStatus.UNAUTHORIZED;
            errorMessage = "Authentication failed against database server. Please check your credentials.";
        }
        else if (error.errorCode === "P1001") {
            statusCode = httpStatus.SERVICE_UNAVAILABLE;
            errorMessage = "Can't reach database server. Please check your connection string.";
        }
        else if (error.errorCode === "P1002") {
            statusCode = httpStatus.REQUEST_TIMEOUT;
            errorMessage = "Database connection timed out. Please try again.";
        }
        else if (error.errorCode === "P1003") {
            statusCode = httpStatus.SERVICE_UNAVAILABLE;
            errorMessage = "Database server is not available.";
        }
        else if (error.errorCode === "P1008") {
            statusCode = httpStatus.REQUEST_TIMEOUT;
            errorMessage = "Operations timed out. Please try again later.";
        }
        else if (error.errorCode === "P1009") {
            statusCode = httpStatus.INTERNAL_SERVER_ERROR;
            errorMessage = "Database already exists with different case name.";
        }
        else {
            statusCode = httpStatus.INTERNAL_SERVER_ERROR;
            errorMessage = `Database connection error: ${error.message}`;
        }
    }
    // Handle Prisma Unknown Request Errors
    else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = "An unknown database error occurred during query execution. Please try again.";
        errorName = "Unknown Database Error";
    }
    // Handle Prisma Rust Panic Errors
    else if (error instanceof Prisma.PrismaClientRustPanicError) {
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        errorMessage = "A critical database engine error occurred. Please contact support.";
        errorName = "Database Engine Error";
    }

    // Send error response
    res.status(statusCode || httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        statusCode: statusCode || httpStatus.INTERNAL_SERVER_ERROR,
        // prismaErrorCode: error.code || null,
        message: errorMessage,
        name: errorName,
        errorDetails: error.stack,
    });
};

export default globalErrorHandler;