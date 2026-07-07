export interface ICreateBooking {
    technicianId: string;
    serviceId: string;
    scheduledDate: string;
    scheduledTime: string;
    address: string;
    notes?: string;
    totalAmount: number;
}

export interface IUpdateBooking {
    status?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    address?: string;
    notes?: string;
    totalAmount?: number;
}
