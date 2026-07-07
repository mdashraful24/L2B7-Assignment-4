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

    // Filter by min hourly rate
    if (query.minHourlyRate) {
        andConditions.push({
            hourlyRate: {
                gte: Number(query.minHourlyRate)
            }
        });
    }

    // Filter by max hourly rate
    if (query.maxHourlyRate) {
        andConditions.push({
            hourlyRate: {
                lte: Number(query.maxHourlyRate)
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
                    email: true,
                    password: true,
                    role: true,
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
                    email: true,
                    password: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true
                }
            },
            reviews: {
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    customer: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            services: true,
            availability: {
                where: {
                    isAvailable: true
                },
                orderBy: [
                    {
                        dayOfWeek: 'asc'
                    },
                    {
                        startAt: 'asc'
                    }
                ]
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

    // Format availability slots with day names
    // const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // const formattedAvailability = technician.availability.map(slot => ({
    //     ...slot,
    //     dayName: dayNames[slot.dayOfWeek]
    // }));

    return {
        ...technician,
        // availability: formattedAvailability,
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

    const { name, email, password, phone, address, bio, skills, experience, hourlyRate, description, location } = payload;

    if (email) {
        const existingUser = await prisma.user.findFirst({
            where: {
                email,
                NOT: {
                    id: technicianId,
                },
            },
        });

        if (existingUser) {
            throw new SelfError(
                "Email already exists",
                httpStatus.CONFLICT
            );
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
                    hourlyRate,
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

    const existingSlot = await prisma.availableSlot.findFirst({
        where: {
            technicianId: technicianProfile.id,
            dayOfWeek,
            startAt: new Date(startAt),
            endAt: new Date(endAt),
        },
    });

    if (existingSlot) {
        throw new SelfError("Availability slot already exists", httpStatus.CONFLICT);
    }

    const actualDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",][new Date(startAt).getUTCDay()];

    if (dayOfWeek !== actualDay) {
        throw new SelfError(
            `Invalid dayOfWeek. The provided startAt date falls on ${actualDay}, but received ${dayOfWeek}.`,
            httpStatus.BAD_REQUEST
        );
    }

    const availableTimeSlot = await prisma.availableSlot.create({
        data: {
            technicianId: technicianProfile.id,
            dayOfWeek,
            startAt: new Date(startAt),
            endAt: new Date(endAt),
            isAvailable: isAvailable ?? true,
        },
    });

    return availableTimeSlot;
};

const updateAvailabilitySlotFromDB = async (technicianId: string, payload: IUpdateAvailabilitySlotPayload) => {
    const { id, dayOfWeek, startAt, endAt, isAvailable } = payload;

    if (!id) {
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
            id: id,
            technicianId: technicianProfile.id,
        },
    });

    if (!existingSlot) {
        throw new SelfError("Availability slot not found", httpStatus.NOT_FOUND);
    }

    const updatedAvailabilitySlot = prisma.availableSlot.update({
        where: {
            id: id,
        },
        data: {
            dayOfWeek,
            startAt: startAt ? new Date(startAt) : undefined,
            endAt: endAt ? new Date(endAt) : undefined,
            isAvailable
        },
    });

    return updatedAvailabilitySlot;
};

const getTechniciansBookings = async (technicianId: string, query: IBookingStatusPayload) => {
    const technicianProfile = await prisma.technicianProfile.findUnique({
        where: {
            userId: technicianId,
        },
        select: {
            id: true,
        },
    });

    if (!technicianProfile) {
        throw new SelfError("", httpStatus.NOT_FOUND);
    }

    // const where = {
    //     technicianId: technicianProfile.id,
    //     ...(query.status ? { status: query.status as BookingStatus } : {}),
    // };

    const technicianBookings = await prisma.booking.findMany({
        where: {
            technicianId: technicianProfile.id,
            status: query.status,
        },
        orderBy: {
            createdAt: 'desc',
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
            }
        },
    });

    return technicianBookings;
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