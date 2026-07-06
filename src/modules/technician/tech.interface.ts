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
    startTime: string;
    endTime: string;
    isAvailable?: boolean;
}

export interface IUpdateAvailabilitySlotPayload {
    id: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    isAvailable?: boolean;
}

export interface IBookingStatusPayload {
    status?: BookingStatus;
}