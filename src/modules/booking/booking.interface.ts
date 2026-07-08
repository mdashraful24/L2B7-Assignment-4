import { BookingStatus } from "../../../generated/prisma/enums";

export interface ICreateBooking {
    technicianId: string;
    categoryId: string;
    serviceId: string;
    availableSlotId: string;
    scheduledAt: string;
    address: string;
    notes?: string;
    totalAmount: number;
}

export interface IUpdateBooking {
    status?: BookingStatus;
    scheduledAt?: string;
    address?: string;
    notes?: string;
    totalAmount?: number;
    availableSlotId?: string;
}
