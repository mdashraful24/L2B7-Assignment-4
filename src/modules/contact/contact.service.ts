import httpStatus from 'http-status';
import { ContactWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { SelfError } from "../../utils/errorResponse";
import { ICreateContact, IGetAllContactInfo, IReplyContact } from "./contact.interface";

const createContactDB = async (userId: string, payload: ICreateContact) => {
    const isUserExists = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!isUserExists) {
        throw new SelfError("User not found.", httpStatus.NOT_FOUND);
    }

    const { name, email, subject, message } = payload;

    if (!name.trim() || !email || !subject.trim() || !message.trim()) {
        throw new SelfError("Please fill in all the required fields.", httpStatus.BAD_REQUEST);
    }

    const result = await prisma.contact.create({
        data: {
            name,
            email,
            subject,
            message,
            userId,
        }
    });

    return result;
};

const getMyContacts = async (
    userId: string,
    query: IGetAllContactInfo
) => {
    const limit = query.limit
        ? Math.max(Number(query.limit), 1)
        : 10;

    const page = query.page
        ? Math.max(Number(query.page), 1)
        : 1;

    const skip = (page - 1) * limit;

    const sortBy =
        query.sortBy === "updatedAt"
            ? "updatedAt"
            : "createdAt";

    const sortOrder =
        query.sortOrder === "asc"
            ? "asc"
            : "desc";

    const andConditions: ContactWhereInput[] = [
        {
            userId,
        },
    ];

    if (query.searchTerm?.trim()) {
        andConditions.push({
            OR: [
                {
                    subject: {
                        contains: query.searchTerm.trim(),
                        mode: "insensitive",
                    },
                },
                {
                    message: {
                        contains: query.searchTerm.trim(),
                        mode: "insensitive",
                    },
                },
                {
                    reply: {
                        contains: query.searchTerm.trim(),
                        mode: "insensitive",
                    },
                },
            ],
        });
    }

    const whereConditions: ContactWhereInput = {
        AND: andConditions,
    };

    const [data, total] = await Promise.all([
        prisma.contact.findMany({
            where: whereConditions,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                repliedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        }),

        prisma.contact.count({
            where: whereConditions,
        }),
    ]);

    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
    };
};

const getAllContacts = async (
    query: IGetAllContactInfo
) => {
    const limit = query.limit
        ? Math.max(Number(query.limit), 1)
        : 10;

    const page = query.page
        ? Math.max(Number(query.page), 1)
        : 1;

    const skip = (page - 1) * limit;

    const allowedSortFields = [
        "createdAt",
        "updatedAt",
        "name",
        "email",
        "subject",
    ];

    const sortBy = allowedSortFields.includes(
        query.sortBy || ""
    )
        ? query.sortBy!
        : "createdAt";

    const sortOrder =
        query.sortOrder === "asc"
            ? "asc"
            : "desc";

    const andConditions: ContactWhereInput[] = [];

    if (query.searchTerm?.trim()) {
        andConditions.push({
            OR: [
                {
                    name: {
                        contains: query.searchTerm.trim(),
                        mode: "insensitive",
                    },
                },
                {
                    email: {
                        contains: query.searchTerm.trim(),
                        mode: "insensitive",
                    },
                },
                {
                    subject: {
                        contains: query.searchTerm.trim(),
                        mode: "insensitive",
                    },
                },
                {
                    message: {
                        contains: query.searchTerm.trim(),
                        mode: "insensitive",
                    },
                },
                {
                    reply: {
                        contains: query.searchTerm.trim(),
                        mode: "insensitive",
                    },
                },
            ],
        });
    }

    const whereConditions: ContactWhereInput = {
        AND: andConditions,
    };

    const [data, total] = await Promise.all([
        prisma.contact.findMany({
            where: whereConditions,
            skip,
            take: limit,
            // Order by: first by reply status (null first = unreplied), then by createdAt
            orderBy: [
                {
                    reply: sortOrder === "asc" ? "asc" : "desc",
                },
                {
                    [sortBy]: sortOrder,
                },
            ],
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                repliedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        }),

        prisma.contact.count({
            where: whereConditions,
        }),
    ]);

    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
    };
};

const singleContact = async (id: string) => {
    const result = await prisma.contact.findUnique({
        where: {
            id,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    phone: true,
                    address: true,
                },
            },
            repliedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!result) {
        throw new SelfError(
            "Contact not found",
            httpStatus.NOT_FOUND
        );
    }

    return result;
};

const replyContact = async (
    contactId: string,
    payload: IReplyContact,
    adminId: string
) => {
    const { reply } = payload;

    if (!reply?.trim()) {
        throw new SelfError(
            "Reply cannot be empty.",
            httpStatus.BAD_REQUEST
        );
    }

    const contact = await prisma.contact.findUnique({
        where: {
            id: contactId,
        },
    });

    if (!contact) {
        throw new SelfError(
            "Contact not found",
            httpStatus.NOT_FOUND
        );
    }

    const result = await prisma.contact.update({
        where: {
            id: contactId,
        },
        data: {
            reply: reply.trim(),
            repliedAt: new Date(),
            repliedById: adminId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            repliedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    return result;
};


export const contactService = {
    createContactDB,
    getMyContacts,
    getAllContacts,
    singleContact,
    replyContact,
};
