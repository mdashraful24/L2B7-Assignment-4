import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';
import { SelfError } from '../../utils/errorResponse';
import { BookingStatus } from '../../../generated/prisma/enums';
import { ICreateBooking, IUpdateBooking } from './booking.interface';

const createBookingIntoDB = async (customerId: string, payload: ICreateBooking) => {
    const { technicianId, serviceId, scheduledDate, scheduledTime, address, notes, totalAmount } = payload;

    if (!technicianId || !serviceId || !scheduledDate || !scheduledTime || !address || totalAmount === undefined) {
        throw new SelfError('technicianId, serviceId, scheduledDate, scheduledTime, address and totalAmount are required', httpStatus.BAD_REQUEST);
    }

    const technician = await prisma.technicianProfile.findUnique({
        where: { id: technicianId }
    });

    if (!technician) {
        throw new SelfError('Technician not found', httpStatus.NOT_FOUND);
    }

    const service = await prisma.service.findFirst({
        where: {
            id: serviceId,
            technicianId
        }
    });

    if (!service) {
        throw new SelfError('Service not found for this technician', httpStatus.NOT_FOUND);
    }

    const createdBooking = await prisma.booking.create({
        data: {
            customerId,
            technicianId,
            serviceId,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            address,
            notes,
            totalAmount,
            // status: BookingStatus.REQUESTED,
        },
        include: {
            technician: true,
            service: true,
        },
    });

    return createdBooking;
};

const getAllBooking = async (userId: string, userRole: string) => {
    const where = userRole === 'CUSTOMER'
        ? { customerId: userId }
        : userRole === 'TECHNICIAN'
            ? { technician: { userId } }
            : {};

    const booking = await prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            technician: true,
            service: true,
        },
    });

    return booking;
};

const getSingleBooking = async (userId: string, userRole: string, bookingId: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            technician: true,
            service: true,
        },
    });

    if (!booking) {
        throw new SelfError('Booking not found', httpStatus.NOT_FOUND);
    }

    const isOwner = booking.customerId === userId || booking.technician.userId === userId;
    if (userRole !== 'ADMIN' && !isOwner) {
        throw new SelfError('Forbidden', httpStatus.FORBIDDEN);
    }

    return booking;
};

const updateBookingFromDB = async (userId: string, userRole: string, bookingId: string, payload: IUpdateBooking) => {
    const { status, scheduledDate, scheduledTime, address, notes, totalAmount } = payload;

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
    });

    if (!booking) {
        throw new SelfError('Booking not found', httpStatus.NOT_FOUND);
    }

    const isOwner = booking.customerId === userId || booking.technicianId === userId;
    if (userRole !== 'ADMIN' && !isOwner) {
        throw new SelfError('Forbidden', httpStatus.FORBIDDEN);
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status as BookingStatus;
    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
    if (scheduledTime) updateData.scheduledTime = scheduledTime;
    if (address) updateData.address = address;
    if (notes !== undefined) updateData.notes = notes;
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;

    const updatedBookingData = await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            technician: true,
            service: true,
        },
    });

    return updatedBookingData;
};

const deleteBookingFromBD = async (userId: string, userRole: string, bookingId: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
    });

    if (!booking) {
        throw new SelfError('Booking not found', httpStatus.NOT_FOUND);
    }

    const isOwner = booking.customerId === userId || booking.technicianId === userId;
    if (userRole !== 'ADMIN' && !isOwner) {
        throw new SelfError('Forbidden', httpStatus.FORBIDDEN);
    }

    await prisma.booking.delete({
        where: { id: bookingId }
    });

    return {
        message: 'Booking deleted successfully'
    };
};


export const bookingServices = {
    createBookingIntoDB,
    getAllBooking,
    getSingleBooking,
    updateBookingFromDB,
    deleteBookingFromBD
};