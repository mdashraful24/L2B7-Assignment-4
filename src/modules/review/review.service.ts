import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';
import { SelfError } from '../../utils/errorResponse';
import { BookingStatus } from '../../../generated/prisma/enums';
import { ICreateReview } from './review.interface';

const createReviewIntoDB = async (customerId: string, payload: ICreateReview) => {
    const { bookingId, rating, comment } = payload;

    if (!bookingId) {
        throw new SelfError('Booking ID is required', httpStatus.BAD_REQUEST);
    }

    if (!rating || rating < 1 || rating > 5) {
        throw new SelfError('Rating must be between 1 and 5', httpStatus.BAD_REQUEST);
    }

    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            customerId,
        },
        include: {
            technician: true,
        },
    });

    if (!booking) {
        throw new SelfError('Booking not found', httpStatus.NOT_FOUND);
    }

    if (booking.status !== BookingStatus.COMPLETED) {
        throw new SelfError('You can only review completed bookings', httpStatus.BAD_REQUEST);
    }

    const existingReview = await prisma.review.findUnique({
        where: {
            bookingId,
        },
    });

    if (existingReview) {
        throw new SelfError('This booking has already been reviewed', httpStatus.CONFLICT);
    }

    const review = await prisma.review.create({
        data: {
            bookingId,
            customerId,
            technicianId: booking.technicianId,
            rating,
            comment,
        },
    });

    const reviews = await prisma.review.findMany({
        where: {
            technicianId: booking.technicianId,
        },
    });

    const averageRating = reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;

    await prisma.technicianProfile.update({
        where: {
            id: booking.technicianId,
        },
        data: {
            rating: Number(averageRating.toFixed(1)),
            totalReviews: reviews.length,
        },
    });

    return review;
};


export const reviewServices = {
    createReviewIntoDB,
};