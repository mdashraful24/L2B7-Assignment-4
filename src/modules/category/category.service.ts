import { CategoryWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { IAllCategories } from "./category.interface";

const getAllServiceCategories = async (query: IAllCategories) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder ? query.sortOrder : "desc";

    const andConditions: CategoryWhereInput[] = [];

    // Search by title or description
    if (query.searchTerm) {
        andConditions.push({
            OR: [
                {
                    name: {
                        contains: query.searchTerm,
                        mode: "insensitive"
                    }
                },
                {
                    description: {
                        contains: query.searchTerm,
                        mode: "insensitive"
                    }
                }
            ],
        });
    }

    // Only active categories are visible publicly
    andConditions.push({
        isActive: true
    });

    const categories = await prisma.category.findMany({
        where: {
            AND: [
                ...andConditions,
                {
                    isActive: true,
                },
                {
                    services: {
                        some: {
                            isAvailable: true,
                        },
                    },
                },
            ],
        },
        orderBy: {
            [sortBy]: sortOrder,
        },
        skip,
        take: limit,
        select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            services: {
                where: {
                    isAvailable: true,
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    price: true,
                    duration: true,
                    isAvailable: true
                },
            },
        },
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
            total: totalCategories
        }
    };
};


export const categoryServices = {
    getAllServiceCategories,
};