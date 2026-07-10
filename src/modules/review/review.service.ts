import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';
import { SelfError } from '../../utils/errorResponse';
import { BookingStatus } from '../../../generated/prisma/enums';
import { ICreateReview, IUpdateReview } from './review.interface';

const createReviewIntoDB = async (customerId: string, payload: ICreateReview) => {
    const { bookingId, rating, comment } = payload;

    if (!bookingId) {
        throw new SelfError('Booking ID is required', httpStatus.BAD_REQUEST);
    }

    if (rating === undefined || rating < 1 || rating > 5) {
        throw new SelfError("Rating is required and must be between 1 to 5", httpStatus.BAD_REQUEST);
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
        where: { bookingId },
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

const updateReviewFromDB = async (customerId: string, reviewId: string, payload: IUpdateReview) => {
    const { comment, rating } = payload;

    if (rating === undefined && comment === undefined) {
        throw new SelfError("At least one field (rating or comment) is required to update", httpStatus.BAD_REQUEST);
    }

    const findReview = await prisma.review.findUnique({
        where: {
            id: reviewId,
        },
    });

    if (!findReview) {
        throw new SelfError("Review not found", httpStatus.NOT_FOUND);
    }

    if (findReview.customerId !== customerId) {
        throw new SelfError("You are not authorized to update this review", httpStatus.FORBIDDEN);
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
        throw new SelfError("Rating must be between 1 to 5", httpStatus.BAD_REQUEST);
    }

    const isRatingChanged = rating !== undefined && rating !== findReview.rating;
    const isCommentChanged = comment !== undefined && comment !== findReview.comment;

    if (!isRatingChanged && !isCommentChanged) {
        throw new SelfError("No changes detected", httpStatus.BAD_REQUEST);
    }

    const updatedReview = await prisma.review.update({
        where: {
            id: reviewId
        },
        data: {
            comment,
            rating
        }
    });

    const stats = await prisma.review.aggregate({
        where: {
            technicianId: findReview.technicianId,
        },
        _avg: {
            rating: true,
        },
        _count: {
            rating: true,
        }
    });

    await prisma.technicianProfile.update({
        where: {
            id: findReview.technicianId,
        },
        data: {
            rating: Number((stats._avg.rating ?? 0).toFixed(1)),
            totalReviews: stats._count.rating,
        }
    });

    return updatedReview;
};


export const reviewServices = {
    createReviewIntoDB,
    updateReviewFromDB
};