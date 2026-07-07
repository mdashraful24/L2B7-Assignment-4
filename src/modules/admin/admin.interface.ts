import { BookingStatus, UserStatus } from "../../../generated/prisma/enums";
import { UserWhereInput } from "../../../generated/prisma/models";

export interface IGetUsersQuery extends UserWhereInput {
    searchTerm?: string;
    page?: string;
    limit?: string;
    sortOrder?: string;
    sortBy?: string;
    isAvailable?: string;
}

export interface ICreateCategory {
    name: string;
    description?: string;
    icon?: string;
    isActive?: boolean;
}

export interface IUpdateCategory {
    name?: string;
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

export interface IUpdateUserStatus {
    status: UserStatus;
}

export interface IBookingQuery {
    searchTerm?: string;

    status?: BookingStatus;

    page?: string;
    limit?: string;

    sortBy?: string;
    sortOrder?: "asc" | "desc";
}