import httpStatus from 'http-status';
import { SelfError } from "./errorResponse";

export const getDhakaDate = (date: Date): string =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);

export const validateSameDhakaDay = (startAt: Date, endAt: Date) => {
    if (getDhakaDate(startAt) !== getDhakaDate(endAt)) {
        throw new SelfError(
            "Availability slot must start and end on the same day",
            httpStatus.BAD_REQUEST
        );
    }
};
