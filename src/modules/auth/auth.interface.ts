import { UserRole, UserStatus } from "../../../generated/prisma/enums";

export interface IUser {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    address?: string;
    status: UserStatus;

    bio?: string;
    skills?: string[];
    experience?: string;
    hourlyRate?: number;
    description?: string;
    location?: string;
}

export interface ILoginUser {
    email: string;
    password: string;
}