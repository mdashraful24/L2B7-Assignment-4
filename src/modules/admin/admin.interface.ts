import { UserStatus } from "../../../generated/prisma/enums";

export interface ICreateCategory {
    name: string;
    description?: string;
    icon?: string;
    isActive?: boolean;
}

export interface ICategoryQuery {
    name?: string;
    isActive?: string;

    page?: string;
    limit?: string;

    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface IUpdateCategory {
    name?: string;
    description?: string;
    icon?: string;
    isActive?: boolean;
}

export interface IGetUsersQuery {
    role?: string;
    status?: string;

    searchTerm?: string;

    page?: string;
    limit?: string;

    sortOrder?: "asc" | "desc";
    sortBy?: string;

    isAvailable?: string;
}

export interface IUpdateUserStatus {
    status: UserStatus;
}

export interface IBookingQuery {
    status?: string;

    searchTerm?: string;

    page?: string;
    limit?: string;

    sortBy?: string;
    sortOrder?: "asc" | "desc";
}