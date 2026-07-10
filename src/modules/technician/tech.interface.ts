import { BookingStatus } from "../../../generated/prisma/enums";

export interface IUpdateTechnicianProfile {
    name?: string;
    email?: string;
    password?: string;

    phone?: string;
    address?: string;

    bio?: string;
    skills?: string[];
    experience?: string;
    hourlyRate?: number;
    description?: string;
    location?: string;
}

export interface ITechnician {
    // Pagination
    page?: string;
    limit?: string;
    sortOrder?: string;
    sortBy?: string;

    // Filter fields
    minHourlyRate?: string;
    maxHourlyRate?: string;
    location?: string;
    minRating?: string;
    maxRating?: string;
    skills?: string;
    experience?: string;
}

export interface IAvailabilitySlotPayload {
    dayOfWeek: string;
    startAt: string;
    endAt: string;
    isAvailable?: boolean;
}

export interface IUpdateAvailabilitySlotPayload {
    availabilitySlotId: string;
    dayOfWeek?: string;
    startAt?: string;
    endAt?: string;
    isAvailable?: boolean;
}

export interface IBookingStatusPayload {
    status?: BookingStatus;

    page?: string;
    limit?: string;

    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface IUpdateBookingStatus {
    status: BookingStatus;
}