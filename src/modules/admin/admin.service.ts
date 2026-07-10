import httpStatus from 'http-status';
import { prisma } from "../../lib/prisma";
import { SelfError } from "../../utils/errorResponse";
import { IBookingQuery, ICategoryQuery, ICreateCategory, IGetUsersQuery, IUpdateCategory, IUpdateUserStatus } from "./admin.interface";
import { BookingStatus, UserRole, UserStatus } from '../../../generated/prisma/client';
import { BookingWhereInput, CategoryWhereInput, UserWhereInput } from '../../../generated/prisma/models';

const createServiceCategoryIntoDB = async (payload: ICreateCategory) => {
    const existingCategory = await prisma.category.findUnique({
        where: {
            name: payload.name
        },
    });

    if (existingCategory) {
        throw new SelfError("Category already exists.", httpStatus.CONFLICT);
    }

    const category = await prisma.category.create({
        data: {
            ...payload
        },
    });

    return category;
};

const getAllServiceCategoriesFromDB = async (query: ICategoryQuery) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder ? query.sortOrder : "desc";

    const andConditions: CategoryWhereInput[] = [];

    // Filter by category name
    if (query.name) {
        andConditions.push({
            name: {
                contains: query.name,
                mode: "insensitive"
            }
        });
    }

    // Filter by status
    if (query.isActive !== undefined) {
        andConditions.push({
            isActive: query.isActive === "true",
        });
    }

    const categories = await prisma.category.findMany({
        where: {
            AND: andConditions
        },
        take: limit,
        skip: skip,
        orderBy: {
            [sortBy]: sortOrder,
        }
    });

    const totalCategories = await prisma.category.count({
        where: {
            AND: andConditions
        }
    });

    return {
        data: categories,
        meta: {
            page,
            limit,
            total: totalCategories,
        },
    };
};

const updateServiceCategoriesFromDB = async (id: string, payload: IUpdateCategory) => {
    const { name, description, icon, isActive } = payload;

    const category = await prisma.category.findUnique({
        where: { id },
    });

    if (!category) {
        throw new SelfError("The requested category could not be found.", httpStatus.NOT_FOUND);
    }

    if (isActive !== undefined && category.isActive === isActive) {
        throw new SelfError(`This category is already ${isActive ? "active" : "inactive"}.`, httpStatus.CONFLICT);
    }

    if (name && name.trim()) {
        const existingCategory = await prisma.category.findFirst({
            where: {
                name: {
                    equals: name.trim(),
                    mode: "insensitive",
                },
                NOT: { id },
            },
        });

        if (existingCategory) {
            throw new SelfError("A category with this name already exists. Please choose a different name.", httpStatus.CONFLICT);
        }
    }

    const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
            name,
            description,
            icon,
            isActive,
        },
    });

    return updatedCategory;
};

const getAllUsersFromDB = async (query: IGetUsersQuery) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder ? query.sortOrder : "desc";

    const andConditions: UserWhereInput[] = [];

    // Search by name or email
    if (query.searchTerm) {
        andConditions.push({
            OR: [
                {
                    name: {
                        contains: query.searchTerm,
                        mode: "insensitive"
                    },
                },
                {
                    email: {
                        contains: query.searchTerm,
                        mode: "insensitive"
                    },
                },
            ],
        });
    }

    // Filter by role
    if (query.role) {
        andConditions.push({
            role: query.role.toUpperCase() as UserRole,
        });
    }

    // Filter by status
    if (query.status) {
        andConditions.push({
            status: query.status.toUpperCase() as UserStatus,
        });
    }

    // Filter by isAvailability (1st start)
    if (query.isAvailable !== undefined) {
        andConditions.push({
            technicianProfile: {
                availability: {
                    some: {
                        isAvailable: query.isAvailable === "true",
                    },
                },
            },
        });
    }
    // (Then 2nd start)
    const availabilityWhere = query.isAvailable !== undefined
        ? { isAvailable: query.isAvailable === "true" }
        : undefined;

    andConditions.push({
        role: {
            in: ["CUSTOMER", "TECHNICIAN"],
        },
    });

    // const where: Prisma.UserWhereInput =
    //     andConditions.length > 0 ? { AND: andConditions } : {};

    const users = await prisma.user.findMany({
        where: {
            AND: andConditions
        },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        omit: {
            password: true
        },
        include: {
            technicianProfile: {
                select: {
                    id: true,
                    bio: true,
                    skills: true,
                    experience: true,
                    description: true,
                    location: true,
                    availability: {
                        where: availabilityWhere,
                        select: {
                            id: true,
                            dayOfWeek: true,
                            startAt: true,
                            endAt: true,
                            isAvailable: true
                        }
                    }
                }
            }
        }
    });

    const totalUsers = await prisma.user.count({
        where: {
            AND: andConditions
        }
    });

    return {
        data: users,
        meta: {
            page,
            limit,
            total: totalUsers,
        },
    };
};

const updateUserStatusIntoDB = async (id: string, payload: IUpdateUserStatus) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: { id }
    });

    const status = String(payload.status).toUpperCase() as UserStatus;

    if (!Object.values(UserStatus).includes(status)) {
        throw new SelfError("Invalid user status. Allowed values are ACTIVE and BANNED.", httpStatus.BAD_REQUEST);
    }

    if (user.status === status) {
        throw new SelfError(`User is already ${status.toLowerCase()}. No changes were made.`, httpStatus.CONFLICT);
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: { status },
        omit: {
            password: true,
        }
    });

    return updatedUser;
};

const getAllBookingsFromDB = async (query: IBookingQuery) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy ? String(query.sortBy) : "createdAt";
    const sortOrder = query.sortOrder ? String(query.sortOrder) : "desc";

    const andConditions: BookingWhereInput[] = [];

    if (query.searchTerm) {
        andConditions.push({
            OR: [
                {
                    address: {
                        contains: String(query.searchTerm),
                        mode: "insensitive",
                    },
                },
                {
                    notes: {
                        contains: String(query.searchTerm),
                        mode: "insensitive",
                    },
                },
            ],
        });
    }

    if (query.status) {
        andConditions.push({
            status: query.status.toUpperCase() as BookingStatus,
        });
    }

    const bookings = await prisma.booking.findMany({
        where: {
            AND: andConditions,
        },
        take: limit,
        skip: skip,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            technician: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            status: true
                        }
                    }
                }
            },
            service: true,
        },
    });

    const totalBookings = await prisma.booking.count({
        where: {
            AND: andConditions,
        },
    });

    return {
        data: bookings,
        meta: {
            page,
            limit,
            total: totalBookings,
        },
    };
};


export const adminServices = {
    createServiceCategoryIntoDB,
    getAllServiceCategoriesFromDB,
    updateServiceCategoriesFromDB,
    getAllUsersFromDB,
    updateUserStatusIntoDB,
    getAllBookingsFromDB,
};