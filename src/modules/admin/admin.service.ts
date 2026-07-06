import httpStatus from 'http-status';
import { prisma } from "../../lib/prisma";
import { SelfError } from "../../utils/errorResponse";
import { ICategoryQuery, ICreateCategory, IGetUsersQuery, IUpdateUserStatus } from "./admin.interface";
import { UserRole, UserStatus } from '../../../generated/prisma/client';
import { CategoryWhereInput, UserWhereInput } from '../../../generated/prisma/models';

const createServiceCategoryIntoDB = async (payload: ICreateCategory) => {
    const existingCategory = await prisma.category.findUnique({
        where: {
            name: payload.name
        },
    });

    if (existingCategory) {
        throw new SelfError("Category already exists", httpStatus.CONFLICT);
    }

    const category = await prisma.category.create({
        data: {
            ...payload
        },
    });

    return category;
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
            role: query.role as UserRole,
        });
    }

    // Filter by status
    if (query.status) {
        andConditions.push({
            status: query.status,
        });
    }

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
                    bio: true,
                    skills: true,
                    experience: true,
                    description: true,
                    location: true,
                    availability: {
                        select:{
                            isAvailable: true
                        }
                    }
                }
            }
        }
    });

    const total = await prisma.user.count({
        where: {
            AND: andConditions
        }
    });

    return {
        data: users,
        meta: {
            page,
            limit,
            total,
        },
    };
};

const updateUserStatusIntoDB = async (id: string, payload: IUpdateUserStatus) => {
    const normalizedStatus = payload.status.toUpperCase() as UserStatus;

    if (!Object.values(UserStatus).includes(normalizedStatus)) {
        throw new SelfError("Invalid user status. Allowed values are ACTIVE and BANNED.", httpStatus.BAD_REQUEST);
    }

    const user = await prisma.user.findUniqueOrThrow({
        where: {
            id
        }
    });

    if (user.status === normalizedStatus) {
        throw new SelfError(`User is already ${normalizedStatus.toLowerCase()}`, httpStatus.CONFLICT);
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            status: payload.status
        },
        omit: {
            password: true,
        }
    });

    return updatedUser;
};

const getAllBookingsFromDB = async (query: any) => {

};

const getAllCategoriesFromDB = async (query: ICategoryQuery) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder ? query.sortOrder : "desc";

    const andConditions: CategoryWhereInput[] = [];

    // Filter by category name
    if (query.name) {
        andConditions.push({
            name: query.name,
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
        skip,
        take: limit,
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


export const adminServices = {
    getAllUsersFromDB,
    updateUserStatusIntoDB,
    getAllBookingsFromDB,
    getAllCategoriesFromDB,
    createServiceCategoryIntoDB,
};