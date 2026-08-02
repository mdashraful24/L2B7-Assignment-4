import httpStatus from 'http-status';
import { prisma } from "../../lib/prisma";
import { IAvailabilitySlotPayload, IBookingStatusPayload, ITechnician, IUpdateAvailabilitySlotPayload, IUpdateBookingStatus, IUpdateTechnicianProfile } from "./tech.interface";
import { TechnicianProfileWhereInput } from "../../../generated/prisma/models";
import { SelfError } from "../../utils/errorResponse";
import bcrypt from 'bcryptjs';
import config from '../../config';
import { BookingStatus, UserRole } from '../../../generated/prisma/enums';

const getAllTechnician = async (query: ITechnician) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder ? query.sortOrder : "desc";

    const skills = query.skills ? JSON.parse(query.skills as string) : null;
    const skillsArray = Array.isArray(skills) ? skills : [];

    const andConditions: TechnicianProfileWhereInput[] = [];

    // Filter by skills
    if (query.skills && skillsArray.length > 0) {
        andConditions.push({
            skills: {
                hasSome: skillsArray
            }
        });
    }

    // Filter by location
    if (query.location) {
        andConditions.push({
            location: {
                contains: query.location,
                mode: "insensitive"
            }
        });
    }

    // Filter by min rating
    if (query.minRating) {
        andConditions.push({
            rating: {
                gte: Number(query.minRating)
            }
        });
    }

    // Filter by max rating
    if (query.maxRating) {
        andConditions.push({
            rating: {
                lte: Number(query.maxRating)
            }
        });
    }

    // Filter by experience
    if (query.experience) {
        andConditions.push({
            experience: {
                contains: query.experience,
                mode: "insensitive"
            }
        });
    }

    // Always filter for active users
    andConditions.push({
        user: {
            status: "ACTIVE"
        }
    });

    const technicians = await prisma.technicianProfile.findMany({
        where: {
            AND: andConditions
        },
        take: limit,
        skip: skip,
        orderBy: {
            [sortBy]: sortOrder
        },
        include: {
            user: {
                omit: {
                    // id: true,
                    // email: true,
                    password: true,
                    // role: true,
                    createdAt: true,
                    updatedAt: true
                },
            },
            services: {
                include: {
                    category: true
                }
            },
            availability: true
        }
    });

    const totalTechnicianCount = await prisma.technicianProfile.count({
        where: {
            AND: andConditions
        }
    });

    return {
        data: technicians,
        meta: {
            page: page,
            limit: limit,
            total: totalTechnicianCount,
            totalPage: Math.ceil(totalTechnicianCount / limit),
        }
    };
};

const getSingleTechnician = async (techId: string) => {
    const technician = await prisma.technicianProfile.findUnique({
        where: {
            id: techId
        },
        include: {
            user: {
                omit: {
                    id: true,
                    // email: true,
                    password: true,
                    // role: true,
                    createdAt: true,
                    updatedAt: true
                }
            },
            reviews: {
                select: {
                    rating: true,
                    comment: true,
                    createdAt: true,
                    customer: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            services: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    price: true,
                    duration: true
                }
            },
            availability: {
                orderBy: {
                    createdAt: "desc",
                },
                select: {
                    id: true,
                    dayOfWeek: true,
                    startAt: true,
                    endAt: true,
                    isAvailable: true,
                    createdAt: true,
                },
            }
        }
    });

    // Check if technician exists
    if (!technician) {
        throw new SelfError("Technician not found", httpStatus.NOT_FOUND);
    }

    // Check if technician is active
    if (technician.user.status !== 'ACTIVE') {
        throw new SelfError("Technician is currently unavailable", httpStatus.FORBIDDEN);
    }

    // Calculate review statistics
    const reviewStats = {
        totalReviews: technician.reviews.length,
        averageRating: technician.rating,
        ratingDistribution: {
            1: technician.reviews.filter(r => r.rating === 1).length,
            2: technician.reviews.filter(r => r.rating === 2).length,
            3: technician.reviews.filter(r => r.rating === 3).length,
            4: technician.reviews.filter(r => r.rating === 4).length,
            5: technician.reviews.filter(r => r.rating === 5).length,
        }
    };

    return {
        ...technician,
        reviewStats
    };
};

const updateProfileFromDB = async (technicianId: string, payload: IUpdateTechnicianProfile) => {
    const technician = await prisma.user.findFirst({
        where: {
            id: technicianId,
            role: UserRole.TECHNICIAN,
        },
        include: {
            technicianProfile: true,
        },
    });

    if (!technician) {
        throw new SelfError("Technician not found", httpStatus.NOT_FOUND);
    }

    if (!technician.technicianProfile) {
        throw new SelfError("Technician profile not found", httpStatus.NOT_FOUND);
    }

    const { name, email, password, phone, address, bio, skills, experience, description, location } = payload;

    if (email && email !== technician.email) {
        const existingUser = await prisma.user.findFirst({
            where: {
                email,
            },
        });

        if (existingUser) {
            throw new SelfError("Email already exists", httpStatus.CONFLICT);
        }
    }

    let hashedPassword: string | undefined;

    if (password) {
        hashedPassword = await bcrypt.hash(password, Number(config.security.bcryptSaltRounds));
    }

    const updatedProfile = await prisma.user.update({
        where: {
            id: technicianId,
        },
        data: {
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            technicianProfile: {
                update: {
                    bio,
                    skills,
                    experience,
                    description,
                    location,
                },
            },
        },
        omit: {
            password: true,
        },
        include: {
            technicianProfile: true,
        },
    });

    return updatedProfile;
};

const createAvailabilitySlotIntoDB = async (technicianId: string, payload: IAvailabilitySlotPayload) => {
    const { dayOfWeek, startAt, endAt, isAvailable } = payload;

    if (!dayOfWeek || !startAt || !endAt) {
        throw new SelfError("dayOfWeek, startAt and endAt are required", httpStatus.BAD_REQUEST);
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    // Validate date format
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new SelfError("Invalid date format", httpStatus.BAD_REQUEST);
    }

    // Validate time range
    if (startDate >= endDate) {
        throw new SelfError("startAt must be earlier than endAt", httpStatus.BAD_REQUEST);
    }

    const technicianProfile = await prisma.technicianProfile.findUnique({
        where: {
            userId: technicianId,
        },
        select: {
            id: true,
        },
    });

    // console.log(technicianProfile);

    if (!technicianProfile) {
        throw new SelfError("Technician profile not found", httpStatus.NOT_FOUND);
    }

    // Bangladesh timezone day validation
    const actualDay = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "Asia/Dhaka",
    }).format(startDate);

    if (dayOfWeek !== actualDay) {
        throw new SelfError(`Invalid dayOfWeek. The provided startAt falls on ${actualDay} in Bangladesh timezone, but received ${dayOfWeek}.`, httpStatus.BAD_REQUEST);
    }

    // Check duplicate slot
    const existingSlot = await prisma.availableSlot.findFirst({
        where: {
            technicianId: technicianProfile.id,
            dayOfWeek,
            startAt: startDate,
            endAt: endDate,
        },
    });

    if (existingSlot) {
        throw new SelfError("Availability slot already exists", httpStatus.CONFLICT);
    }

    // Check overlapping slots
    const overlappingSlot = await prisma.availableSlot.findFirst({
        where: {
            technicianId: technicianProfile.id,
            dayOfWeek,
            AND: [
                {
                    startAt: {
                        lt: endDate,
                    },
                },
                {
                    endAt: {
                        gt: startDate,
                    },
                },
            ],
        },
    });

    if (overlappingSlot) {
        throw new SelfError("Time slot overlaps with an existing availability slot", httpStatus.CONFLICT);
    }

    const availableTimeSlot = await prisma.availableSlot.create({
        data: {
            technicianId: technicianProfile.id,
            dayOfWeek,
            startAt: startDate,
            endAt: endDate,
            isAvailable: isAvailable ?? true,
        },
    });

    return availableTimeSlot;
};

const updateAvailabilitySlotFromDB = async (technicianId: string, payload: IUpdateAvailabilitySlotPayload) => {
    const { availabilitySlotId, dayOfWeek, startAt, endAt, isAvailable } = payload;

    if (!availabilitySlotId) {
        throw new SelfError("Availability slot ID is required", httpStatus.BAD_REQUEST);
    }

    const technicianProfile = await prisma.technicianProfile.findUnique({
        where: {
            userId: technicianId,
        },
        select: {
            id: true,
        },
    });

    if (!technicianProfile) {
        throw new SelfError("Technician profile not found", httpStatus.NOT_FOUND);
    }

    const existingSlot = await prisma.availableSlot.findFirst({
        where: {
            id: availabilitySlotId,
            technicianId: technicianProfile.id,
        },
    });

    if (!existingSlot) {
        throw new SelfError("Availability slot not found", httpStatus.NOT_FOUND);
    }

    const booking = await prisma.booking.findUnique({
        where: {
            availableSlotId: availabilitySlotId,
        },
        select: {
            id: true,
            status: true,
        },
    });

    if (booking && !["CANCELLED", "DECLINED"].includes(booking.status)) {
        throw new SelfError("This availability slot has an active booking and cannot be updated.", httpStatus.CONFLICT);
    }

    if (!existingSlot.isAvailable && isAvailable !== true) {
        throw new SelfError("This slot is currently unavailable. Please enable availability before updating.", httpStatus.BAD_REQUEST);
    }

    const updatedStartAt = startAt
        ? new Date(startAt)
        : existingSlot.startAt;

    const updatedEndAt = endAt
        ? new Date(endAt)
        : existingSlot.endAt;

    const updatedDayOfWeek = dayOfWeek || existingSlot.dayOfWeek;

    // Validate date format
    if (isNaN(updatedStartAt.getTime()) || isNaN(updatedEndAt.getTime())) {
        throw new SelfError("Invalid date format", httpStatus.BAD_REQUEST);
    }

    // Validate start and end time
    if (updatedStartAt >= updatedEndAt) {
        throw new SelfError("startAt must be earlier than endAt", httpStatus.BAD_REQUEST);
    }

    // Bangladesh timezone validation
    const actualDay = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "Asia/Dhaka",
    }).format(updatedStartAt);


    if (updatedDayOfWeek !== actualDay) {
        throw new SelfError(`Invalid dayOfWeek. The provided startAt falls on ${actualDay} in Bangladesh timezone, but received ${updatedDayOfWeek}.`, httpStatus.BAD_REQUEST);
    }

    // Duplicate check
    const duplicateSlot = await prisma.availableSlot.findFirst({
        where: {
            technicianId: technicianProfile.id,
            dayOfWeek: updatedDayOfWeek,
            startAt: updatedStartAt,
            endAt: updatedEndAt,
            NOT: {
                id: availabilitySlotId,
            },
        },
    });

    if (duplicateSlot) {
        throw new SelfError("Availability slot already exists", httpStatus.CONFLICT);
    }

    // Overlap check
    const overlappingSlot = await prisma.availableSlot.findFirst({
        where: {
            technicianId: technicianProfile.id,
            dayOfWeek: updatedDayOfWeek,
            AND: [
                {
                    startAt: {
                        lt: updatedEndAt,
                    },
                },
                {
                    endAt: {
                        gt: updatedStartAt,
                    },
                },
            ],
            NOT: {
                id: availabilitySlotId,
            },
        },
    });

    if (overlappingSlot) {
        throw new SelfError("Time slot overlaps with an existing availability slot", httpStatus.CONFLICT);
    }

    const updatedAvailabilitySlot = await prisma.availableSlot.update({
        where: {
            id: availabilitySlotId,
        },
        data: {
            dayOfWeek: updatedDayOfWeek,
            startAt: updatedStartAt,
            endAt: updatedEndAt,
            isAvailable:
                isAvailable !== undefined
                    ? isAvailable
                    : existingSlot.isAvailable,
        },
    });

    return updatedAvailabilitySlot;
};

const getTechniciansBookings = async (technicianId: string, query: IBookingStatusPayload) => {
    const limit = Number(query.limit) || 10;
    const page = Number(query.page) || 1;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    const technicianProfile = await prisma.technicianProfile.findUnique({
        where: {
            userId: technicianId,
        },
        select: {
            id: true,
        },
    });

    if (!technicianProfile) {
        throw new SelfError(
            "Technician profile not found",
            httpStatus.NOT_FOUND
        );
    }

    const whereCondition = {
        technicianId: technicianProfile.id,
        status: query.status,
    };

    const technicianBookings = await prisma.booking.findMany({
        where: whereCondition,
        take: limit,
        skip,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            service: true,
            technician: {
                select: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                            address: true,
                        },
                    },
                    location: true,
                },
            },
            review: true
        },
    });

    const totalBookings = await prisma.booking.count({
        where: whereCondition,
    });

    return {
        data: technicianBookings,
        meta: {
            page,
            limit,
            total: totalBookings,
            totalPage: Math.ceil(totalBookings / limit),
        },
    };
};

const updateBookingStatusFromDB = async (technicianId: string, bookingId: string, payload: IUpdateBookingStatus) => {
    if (!bookingId) {
        throw new SelfError("Booking ID is required", httpStatus.BAD_REQUEST);
    }

    if (!payload.status) {
        throw new SelfError("Booking status is required", httpStatus.BAD_REQUEST);
    }

    const technicianProfile = await prisma.technicianProfile.findUnique({
        where: {
            userId: technicianId,
        },
        select: {
            id: true,
        },
    });

    if (!technicianProfile) {
        throw new SelfError("Technician profile not found", httpStatus.NOT_FOUND);
    }

    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            technicianId: technicianProfile.id,
        },
    });

    if (!booking) {
        throw new SelfError("Booking not found", httpStatus.NOT_FOUND);
    }

    const status = payload.status.toUpperCase() as BookingStatus;
    if (!Object.values(BookingStatus).includes(status)) {
        throw new SelfError("Invalid booking status", httpStatus.BAD_REQUEST);
    }

    const updatedStatus = prisma.booking.update({
        where: {
            id: bookingId,
        },
        data: {
            status,
        },
    });

    return updatedStatus;
};


export const technicianService = {
    getAllTechnician,
    getSingleTechnician,
    updateProfileFromDB,
    createAvailabilitySlotIntoDB,
    updateAvailabilitySlotFromDB,
    getTechniciansBookings,
    updateBookingStatusFromDB
};