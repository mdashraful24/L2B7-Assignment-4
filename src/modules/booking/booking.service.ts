import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';
import { SelfError } from '../../utils/errorResponse';
import { ICreateBooking, IUpdateBooking } from './booking.interface';
import { BookingStatus } from '../../../generated/prisma/enums';

const createBookingIntoDB = async (customerId: string, payload: ICreateBooking) => {
    const { technicianId, categoryId, serviceId, availableSlotId, scheduledAt, address, notes, totalAmount, } = payload;

    if (!technicianId || !categoryId || !serviceId || !availableSlotId || !scheduledAt || !address || totalAmount === undefined) {
        throw new SelfError("technicianId, categoryId, serviceId, availableSlotId, scheduledAt, address and totalAmount are required", httpStatus.BAD_REQUEST);
    }

    const bookingDateTime = new Date(scheduledAt);

    if (Number.isNaN(bookingDateTime.getTime())) {
        throw new SelfError("Invalid scheduledAt datetime", httpStatus.BAD_REQUEST);
    }

    const technician = await prisma.technicianProfile.findUnique({
        where: {
            id: technicianId,
        },
        include: {
            availability: {
                where: {
                    isAvailable: true,
                },
            },
        },
    });

    if (!technician) {
        throw new SelfError("Technician not found", httpStatus.NOT_FOUND);
    }

    const service = await prisma.service.findFirst({
        where: {
            id: serviceId,
            technicianId,
            categoryId,
            isAvailable: true,
        },
        include: {
            category: true,
        },
    });

    if (!service) {
        throw new SelfError("Service not found for the selected technician and category", httpStatus.NOT_FOUND);
    }

    const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",][bookingDateTime.getDay()];

    const selectedSlot = await prisma.availableSlot.findFirst({
        where: {
            id: availableSlotId,
            technicianId,
            isAvailable: true,
        },
    });

    if (!selectedSlot) {
        throw new SelfError("Selected availability slot was not found or is no longer available", httpStatus.NOT_FOUND);
    }

    console.log({
        scheduledAt: bookingDateTime,
        bookingDay: dayOfWeek,
        slotDay: selectedSlot.dayOfWeek,
        startAt: selectedSlot.startAt,
        endAt: selectedSlot.endAt,
    });

    if (selectedSlot.dayOfWeek !== dayOfWeek) {
        throw new SelfError("Selected availability slot does not match the requested day", httpStatus.BAD_REQUEST);
    }

    const slotStart = new Date(selectedSlot.startAt);
    const slotEnd = new Date(selectedSlot.endAt);

    if (bookingDateTime < slotStart || bookingDateTime >= slotEnd) {
        throw new SelfError("Selected availability slot does not match the requested time", httpStatus.BAD_REQUEST);
    }

    const existingBooking = await prisma.booking.findFirst({
        where: { availableSlotId },
    });

    if (existingBooking) {
        throw new SelfError("This availability slot is already booked", httpStatus.CONFLICT);
    }

    const createdBooking = await prisma.$transaction(async (tx) => {
        const booked = await tx.booking.create({
            data: {
                customerId,
                technicianId,
                serviceId,
                availableSlotId,
                scheduledAt: bookingDateTime,
                address,
                notes,
                totalAmount,
            },
            include: {
                technician: true,
                service: true,
                availableSlot: true,
            },
        });

        await tx.availableSlot.update({
            where: {
                id: availableSlotId,
            },
            data: {
                isAvailable: false,
            },
        });

        return booked;
    });

    return createdBooking;
};

const getAllBooking = async (userId: string) => {
    const booking = await prisma.booking.findMany({
        where: {
            customerId: userId
        },
        orderBy: { createdAt: 'desc' },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            technician: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                        }
                    }
                }
            },
            service: true,
        },
    });

    return booking;
};

const getSingleBooking = async (userId: string, bookingId: string) => {
    const booking = await prisma.booking.findUnique({
        where: {
            id: bookingId,
            customerId: userId
        },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            service: true,
            technician: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                        }
                    }
                }
            },
            availableSlot: {
                select: {
                    dayOfWeek: true,
                    startAt: true,
                    endAt: true,
                    isAvailable: true
                }
            }
        },
    });

    if (!booking) {
        throw new SelfError('Booking not found', httpStatus.NOT_FOUND);
    }

    return booking;
};

const updateBookingFromDB = async (userId: string, bookingId: string, payload: IUpdateBooking) => {
    const { scheduledAt, address, notes, availableSlotId, } = payload;

    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            customerId: userId,
        },
    });

    if (!booking) {
        throw new SelfError('Booking not found', httpStatus.NOT_FOUND);
    }

    if (booking.status === BookingStatus.IN_PROGRESS ||
        booking.status === BookingStatus.COMPLETED ||
        booking.status === BookingStatus.CANCELLED
    ) {
        throw new SelfError("This booking can no longer be updated.", httpStatus.BAD_REQUEST);
    }

    const updatedBookingData = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            scheduledAt: scheduledAt
                ? new Date(scheduledAt)
                : booking.scheduledAt,
            address,
            notes,
            availableSlotId,
        },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            service: true,
            technician: true,
        },
    });

    return updatedBookingData;
};

const updateBookingStatusFromDB = async (userId: string, bookingId: string, status: string) => {
    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            customerId: userId,
        },
    });

    if (!booking) {
        throw new SelfError("Booking not found", httpStatus.NOT_FOUND);
    }

    const normalizedStatus = String(status).toUpperCase();

    // Customers can only cancel bookings
    if (normalizedStatus !== BookingStatus.CANCELLED) {
        throw new SelfError(
            "Customers can only change booking status to CANCELLED",
            httpStatus.BAD_REQUEST
        );
    }

    // Cannot cancel once work has started or completed
    if (booking.status === BookingStatus.IN_PROGRESS || booking.status === BookingStatus.COMPLETED) {
        throw new SelfError(
            "This booking can no longer be cancelled because the service has already IN_PROGRESS or been COMPLETED.",
            httpStatus.BAD_REQUEST
        );
    }

    // Already cancelled
    if (booking.status === BookingStatus.CANCELLED) {
        throw new SelfError(
            "This booking has already been cancelled.",
            httpStatus.BAD_REQUEST
        );
    }

    const updatedBooking = await prisma.booking.update({
        where: {
            id: bookingId,
        },
        data: {
            status: BookingStatus.CANCELLED,
        },
        include: {
            customer: true,
            service: true,
            technician: true,
        },
    });

    // Release slot after cancellation
    if (booking.availableSlotId) {
        await prisma.availableSlot.update({
            where: {
                id: booking.availableSlotId,
            },
            data: {
                isAvailable: true,
            },
        });
    }

    return updatedBooking;
};


export const bookingServices = {
    createBookingIntoDB,
    getAllBooking,
    getSingleBooking,
    updateBookingFromDB,
    updateBookingStatusFromDB
};