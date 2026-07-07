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
    // status?: string;
    // scheduledDate?: string;
    // scheduledTime?: string;
    scheduledAt?: string;
    address?: string;
    notes?: string;
    totalAmount?: number;
    availableSlotId?: string;
}
