import httpStatus from 'http-status';
import { ContactWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { SelfError } from "../../utils/errorResponse";
import { ICreateContact, IGetAllContactInfo } from "./contact.interface";

const createContactDB = async (payload: ICreateContact) => {
    const {name, email, subject, message} = payload;

    if (!name.trim() || !email || !subject.trim() || !message.trim()) {
        throw new SelfError("Please fill in all the required fields.", httpStatus.BAD_REQUEST);
    }

    const result = await prisma.contact.create({
        data: payload
    });

    return result;
};

const getAllContacts = async (query: IGetAllContactInfo) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder ? query.sortOrder : "desc";

    const andConditions: ContactWhereInput[] = [];

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
                {
                    subject: {
                        contains: query.searchTerm,
                        mode: "insensitive"
                    }
                },
                {
                    message: {
                        contains: query.searchTerm,
                        mode: "insensitive"
                    }
                }
            ],
        });
    }

    const whereConditions: ContactWhereInput = {
        AND: andConditions
    };

    const result = await prisma.contact.findMany({
        where: whereConditions,
        take: limit,
        skip,
        orderBy: [
            {
                [sortBy]: sortOrder,
            },
        ],
    });

    const totalContacts = await prisma.contact.count({
        where: whereConditions
    });

    return {
        data: result,
        meta: {
            page,
            limit,
            total: totalContacts,
            totalPage: Math.ceil(totalContacts / limit),
        },
    };
};

const singleContact = async (id: string) => {
    const result = await prisma.contact.findUnique({
        where: {
            id
        }
    });

    if (!result) {
        throw new SelfError("Contact not found", httpStatus.NOT_FOUND);
    }

    return result;
};


export const contactService = {
    createContactDB,
    getAllContacts,
    singleContact
};
