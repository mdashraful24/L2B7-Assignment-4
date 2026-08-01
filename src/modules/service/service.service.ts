import httpStatus from 'http-status';
import { prisma } from "../../lib/prisma";
import { SelfError } from "../../utils/errorResponse";
import { ICreateService, IUpdateService, IServices } from "./service.interface";
import { UserRole, UserStatus } from '../../../generated/prisma/enums';
import { ServiceWhereInput } from '../../../generated/prisma/models';

const createServiceIntoDB = async (technicianId: string, payload: ICreateService) => {
    const technician = await prisma.user.findUnique({
        where: {
            id: technicianId,
        },
        include: {
            technicianProfile: true,
        },
    });

    if (!technician) {
        throw new SelfError("Technician not found", httpStatus.NOT_FOUND);
    }

    if (technician.role !== UserRole.TECHNICIAN) {
        throw new SelfError("Only technicians can create services", httpStatus.FORBIDDEN);
    }

    if (technician.status !== UserStatus.ACTIVE) {
        throw new SelfError("Your account is not active", httpStatus.FORBIDDEN);
    }

    if (!technician.technicianProfile) {
        throw new SelfError("Technician profile not found", httpStatus.NOT_FOUND);
    }

    await prisma.category.findUniqueOrThrow({
        where: {
            id: payload.categoryId,
        },
    });

    const existingService = await prisma.service.findFirst({
        where: {
            technicianId: technician.technicianProfile.id,
            title: payload.title,
        },
    });

    if (existingService) {
        throw new SelfError("You already have a service with this title", httpStatus.CONFLICT);
    }

    const service = await prisma.service.create({
        data: {
            ...payload,
            hourlyRate: payload.hourlyRate ?? payload.price,
            technicianId: technician.technicianProfile.id,
        },
    });

    return service;
};

const getAllServicesWithFilter = async (query: IServices) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder ? query.sortOrder : "desc";

    const andConditions: ServiceWhereInput[] = [];

    // Search by title or description
    if (query.searchTerm) {
        andConditions.push({
            OR: [
                {
                    title: {
                        contains: query.searchTerm,
                        mode: "insensitive"
                    }
                },
                {
                    description: {
                        contains: query.searchTerm,
                        mode: "insensitive"
                    }
                },
                {
                    category: {
                        name: {
                            contains: query.searchTerm,
                            mode: "insensitive"
                        }
                    }
                },
                {
                    technician: {
                        location: {
                            contains: query.searchTerm,
                            mode: "insensitive"
                        }
                    }
                }
            ],
        });
    }

    if (query.location) {
        andConditions.push({
            technician: {
                location: {
                    contains: query.location,
                    mode: "insensitive",
                },
            },
        });
    }

    if (query.category) {
        andConditions.push({
            category: {
                name: {
                    equals: query.category,
                    mode: "insensitive",
                },
            },
        });
    }

    // Filter by price
    if (query.minPrice || query.maxPrice) {
        andConditions.push({
            price: {
                gte: query.minPrice ? Number(query.minPrice) : undefined,
                lte: query.maxPrice ? Number(query.maxPrice) : undefined,
            },
        });
    }

    // Filter by rating
    if (query.rating) {
        andConditions.push({
            technician: {
                rating: {
                    equals: Number(query.rating),
                },
            },
        });
    }

    // Always filter for available services
    andConditions.push({
        isAvailable: true
    });

    const services = await prisma.service.findMany({
        where: {
            AND: andConditions,
        },
        take: limit,
        skip,
        orderBy: {
            [sortBy]: sortOrder,
        },
        select: {
            id: true,
            title: true,
            description: true,
            price: true,
            hourlyRate: true,
            duration: true,
            serviceImage: true,
            isAvailable: true,

            category: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    icon: true
                },
            },

            technician: {
                select: {
                    id: true,
                    location: true,
                    rating: true,
                    totalReviews: true,
                    user: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    });

    const totalServices = await prisma.service.count({
        where: {
            AND: andConditions
        }
    });

    return {
        data: services,
        meta: {
            page,
            limit,
            total: totalServices,
            totalPage: Math.ceil(totalServices / limit),
        }
    };
};

const getMyServices = async (technicianId: string, query: IServices) => {
    const technician = await prisma.user.findUnique({
        where: {
            id: technicianId,
        },
        include: {
            technicianProfile: true,
        },
    });

    if (!technician) {
        throw new SelfError("Technician not found", httpStatus.NOT_FOUND);
    }

    if (technician.role !== UserRole.TECHNICIAN) {
        throw new SelfError("Only technicians can create services", httpStatus.FORBIDDEN);
    }

    if (technician.status !== UserStatus.ACTIVE) {
        throw new SelfError("Your account is not active", httpStatus.FORBIDDEN);
    }

    if (!technician.technicianProfile) {
        throw new SelfError("Technician profile not found", httpStatus.NOT_FOUND);
    }

    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    const allowedSortFields = ['createdAt', 'price', 'title', 'duration', 'isAvailable'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy)
        ? query.sortBy
        : "createdAt";

    const sortOrder = query.sortOrder ? query.sortOrder : "desc";

    const andConditions: ServiceWhereInput[] = [];

    // Search by title or description
    if (query.searchTerm) {
        andConditions.push({
            OR: [
                {
                    title: {
                        contains: query.searchTerm,
                        mode: "insensitive"
                    }
                },
                {
                    description: {
                        contains: query.searchTerm,
                        mode: "insensitive"
                    }
                },
                {
                    category: {
                        name: {
                            contains: query.searchTerm,
                            mode: "insensitive"
                        }
                    }
                },
                {
                    technician: {
                        location: {
                            contains: query.searchTerm,
                            mode: "insensitive"
                        }
                    }
                }
            ],
        });
    }

    if (query.location) {
        andConditions.push({
            technician: {
                location: {
                    contains: query.location,
                    mode: "insensitive",
                },
            },
        });
    }

    if (query.category) {
        andConditions.push({
            category: {
                name: {
                    equals: query.category,
                    mode: "insensitive",
                },
            },
        });
    }

    // Filter by price
    if (query.minPrice || query.maxPrice) {
        andConditions.push({
            price: {
                gte: query.minPrice ? Number(query.minPrice) : undefined,
                lte: query.maxPrice ? Number(query.maxPrice) : undefined,
            },
        });
    }

    if (query.isAvailable !== undefined) {
        const isAvailableBoolean = query.isAvailable === 'true';
        andConditions.push({
            isAvailable: isAvailableBoolean
        });
    }

    andConditions.push({
        technicianId: technician.technicianProfile.id,
    });

    const services = await prisma.service.findMany({
        where: {
            AND: andConditions,
        },
        take: limit,
        skip,
        orderBy: [
            {
                isAvailable: "desc",
            },
            {
                [sortBy]: sortOrder,
            }
        ],
        select: {
            id: true,
            title: true,
            description: true,
            serviceImage: true,
            price: true,
            hourlyRate: true,
            duration: true,
            isAvailable: true,

            category: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    icon: true
                },
            },

            technician: {
                select: {
                    id: true,
                    location: true,
                    rating: true,
                    totalReviews: true,
                    user: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    });

    const totalServices = await prisma.service.count({
        where: {
            AND: andConditions
        }
    });

    return {
        data: services,
        meta: {
            page,
            limit,
            total: totalServices,
            totalPage: Math.ceil(totalServices / limit),
        }
    };
};

const getSingleService = async (serviceId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const service = await prisma.service.findUniqueOrThrow({
        where: {
            id: serviceId,
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    icon: true,
                },
            },
            technician: {
                select: {
                    id: true,
                    location: true,
                    rating: true,
                    totalReviews: true,
                    user: {
                        select: {
                            name: true,
                            phone: true,
                            address: true,
                        },
                    },
                    availability: {
                        where: {
                            isAvailable: true,
                            startAt: {
                                gte: today,
                            },
                        },
                    },
                    // bookings: true,
                    reviews: true,
                },
            },
        },
    });

    return service;
};

// const getSingleService = async (serviceId: string) => {
//     const service = await prisma.service.findUniqueOrThrow({
//         where: {
//             id: serviceId
//         },
//         include: {
//             category: {
//                 select: {
//                     id: true,
//                     name: true,
//                     description: true,
//                     icon: true
//                 },
//             },
//             technician: {
//                 select: {
//                     id: true,
//                     location: true,
//                     rating: true,
//                     totalReviews: true,
//                     user: {
//                         select: {
//                             name: true,
//                             phone: true,
//                             address: true
//                         },
//                     },
//                     availability: true,
//                     bookings: true,
//                     reviews: true,
//                 },
//             },
//         }
//     });

//     return service;
// };

const updateServiceFromDB = async (technicianId: string, serviceId: string, payload: IUpdateService) => {
    const { categoryId, title, description, price, hourlyRate, duration, isAvailable, skills, experience, serviceImage } = payload;

    const existingService = await prisma.service.findUnique({
        where: {
            id: serviceId,
        },
        include: {
            technician: {
                select: {
                    id: true,
                    userId: true,
                },
            },
        },
    });

    if (!existingService) {
        throw new SelfError("Service not found", httpStatus.NOT_FOUND);
    }

    if (existingService.technician.userId !== technicianId) {
        throw new SelfError("You are not authorized to update this service", httpStatus.FORBIDDEN);
    }

    if (categoryId !== undefined) {
        await prisma.category.findUniqueOrThrow({
            where: {
                id: categoryId,
            },
        });
    }

    if (title !== undefined) {
        const duplicateService = await prisma.service.findFirst({
            where: {
                technicianId: existingService.technicianId,
                title,
                NOT: {
                    id: serviceId,
                },
            },
        });

        if (duplicateService) {
            throw new SelfError("You already have a service with this title", httpStatus.CONFLICT);
        }
    }

    const result = await prisma.$transaction(async (tx) => {
        const updatedService = await tx.service.update({
            where: {
                id: serviceId,
            },
            data: {
                categoryId,
                title,
                description,
                price,
                hourlyRate,
                duration,
                isAvailable,
                serviceImage
            },
        });

        const updatedTechnicianProfile = await tx.technicianProfile.update({
            where: {
                id: existingService.technicianId,
            },
            data: {
                skills,
                experience
            },
        });

        return {
            service: updatedService,
            technicianProfile: updatedTechnicianProfile,
        };
    });

    return result;
};

const deleteServiceFromDB = async (technicianId: string, serviceId: string) => {
    const existingService = await prisma.service.findUnique({
        where: {
            id: serviceId,
        },
        include: {
            technician: true
        },
    });

    if (!existingService) {
        throw new SelfError("Service not found", httpStatus.NOT_FOUND);
    }

    if (existingService.technician.userId !== technicianId) {
        throw new SelfError("You are not authorized to delete this service", httpStatus.FORBIDDEN);
    }

    const deletedService = await prisma.service.delete({
        where: {
            id: serviceId,
        },
    });

    return deletedService;
};


export const serviceServices = {
    createServiceIntoDB,
    getAllServicesWithFilter,
    getMyServices,
    getSingleService,
    updateServiceFromDB,
    deleteServiceFromDB,
};