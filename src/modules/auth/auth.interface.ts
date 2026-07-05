import { UserRole, UserStatus } from "../../../generated/prisma/enums";

export interface IUser {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    status: UserStatus;
    phone?: string | null;
    address?: string | null;
}

export interface ILoginUser {
    email: string;
    password: string;
}