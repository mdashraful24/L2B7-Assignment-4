import httpStatus from 'http-status';
import { prisma } from "../../lib/prisma";
import { ITechnician, IUpdateTechnicianProfile } from "./tech.interface";
import { TechnicianProfileWhereInput } from "../../../generated/prisma/models";
import { SelfError } from "../../utils/errorResponse";
import bcrypt from 'bcryptjs';
import config from '../../config';
import { UserRole } from '../../../generated/prisma/enums';

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
                    id: true,
                    email: true,
                    password: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true
                }
            }
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
                        startTime: 'asc'
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

const createAvailabilitySlotIntoDB = async()=>{

};

const updateAvailabilitySlotFromDB = async()=>{

};

const getTechniciansBookings = async()=>{

};

const updateBookingStatusFromDB = async()=>{

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