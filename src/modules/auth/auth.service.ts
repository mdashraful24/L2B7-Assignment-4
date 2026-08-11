import httpStatus from 'http-status';
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { ILoginUser, IUpdateMe, IUser } from "./auth.interface";
import config from "../../config";
import { SelfError } from "../../utils/errorResponse";
import { jwtUtils } from '../../utils/jwt';
import { JwtPayload, SignOptions } from 'jsonwebtoken';

const registerUserIntoDB = async (payload: IUser) => {
    const { name, email, password, phone, role, address, bio, skills, experience, description, location } = payload;

    if (!name || !email || !password) {
        throw new SelfError("Name, email and password are required", httpStatus.BAD_REQUEST);
    }

    if (!role || !["CUSTOMER", "TECHNICIAN"].includes(role)) {
        throw new SelfError("Role is required", httpStatus.BAD_REQUEST);
    }

    // Prevent public admin registration
    if (role === "ADMIN") {
        throw new SelfError("Admin registration is not allowed", httpStatus.FORBIDDEN);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (existingUser) {
        throw new SelfError("User already exists with this email", httpStatus.CONFLICT);
    }

    const hashPassword = await bcrypt.hash(password, Number(config.security.bcryptSaltRounds));

    // Create user with or without technician profile based on role
    let createUser;

    if (role === "TECHNICIAN") {
        createUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashPassword,
                phone,
                address,
                role,
                technicianProfile: {
                    create: {
                        bio,
                        skills,
                        experience,
                        description,
                        location,
                    },
                },
            },
        });
    } else {
        createUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashPassword,
                phone,
                address,
                role,
            },
        });
    }

    const user = await prisma.user.findUnique({
        where: {
            id: createUser.id,
            email: createUser.email || email
        },
        omit: {
            password: true
        },
        include: {
            technicianProfile: true
        }
    });

    return user;
};

const loginUserIntoDB = async (payload: ILoginUser) => {
    const { email, password } = payload;

    const user = await prisma.user.findUniqueOrThrow({
        where: { email }
    });

    if (user.status === "BANNED") {
        throw new SelfError("Your account has been Banned. Please contact support.", httpStatus.FORBIDDEN);
    }

    const isPasswordMatched = await bcrypt.compare(
        password,
        user.password
    )

    if (!isPasswordMatched) {
        throw new SelfError("Incorrect password!", httpStatus.UNAUTHORIZED);
    }

    const jwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt.accessSecret,
        config.jwt.accessExpiresIn as SignOptions
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt.refreshSecret,
        config.jwt.refreshExpiresIn as SignOptions
    );

    return { accessToken, refreshToken };
};

const authRefreshTokenIntoDB = async (refreshToken: string) => {
    const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, config.jwt.refreshSecret);

    if (!verifiedRefreshToken.success) {
        throw new SelfError("Authentication failed. Please log in again.", httpStatus.UNAUTHORIZED);
    }

    const { id } = verifiedRefreshToken.data as JwtPayload;

    const user = await prisma.user.findUniqueOrThrow({
        where: { id }
    });

    if (user.status === "BANNED") {
        throw new SelfError("Your account has been blocked. Please contact support.", httpStatus.FORBIDDEN);
    }

    const JwtPayload = {
        id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    const accessToken = jwtUtils.createToken(
        JwtPayload,
        config.jwt.accessSecret,
        config.jwt.accessExpiresIn as SignOptions
    );

    return { accessToken };
};

const getMeFromDB = async (userId: string) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            id: userId
        },
        omit: {
            password: true
        },
        include: {
            technicianProfile: true
        }
    });

    return user;
};

const updateMeFromDB = async (userId: string, payload: IUpdateMe) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!user) {
        throw new SelfError("User not found", httpStatus.NOT_FOUND);
    }

    const {
        name,
        email,
        password,
        phone,
        address,
    } = payload;

    // Check duplicate email
    if (email && email !== user.email) {
        const existingUser = await prisma.user.findFirst({
            where: {
                email,
                NOT: {
                    id: userId,
                },
            },
        });

        if (existingUser) {
            throw new SelfError("Email already exists", httpStatus.CONFLICT);
        }
    }

    const updateData: {
        name?: string;
        email?: string;
        password?: string;
        phone?: string;
        address?: string;
    } = {};

    // Check changed fields
    if (name !== undefined && name !== user.name) {
        updateData.name = name;
    }

    if (email !== undefined && email !== user.email) {
        updateData.email = email;
    }

    if (phone !== undefined && phone !== user.phone) {
        updateData.phone = phone;
    }

    if (address !== undefined && address !== user.address) {
        updateData.address = address;
    }

    // Password is always considered changed when provided
    if (password?.trim()) {
        updateData.password = await bcrypt.hash(
            password,
            Number(config.security.bcryptSaltRounds)
        );
    }

    // No changes detected
    if (Object.keys(updateData).length === 0) {
        throw new SelfError("No changes detected. Please update at least one field.", httpStatus.BAD_REQUEST);
    }

    const updatedProfile = await prisma.user.update({
        where: {
            id: userId,
        },
        data: updateData,
        omit: {
            password: true,
        },
    });

    return updatedProfile;
};


export const authService = {
    registerUserIntoDB,
    loginUserIntoDB,
    authRefreshTokenIntoDB,
    getMeFromDB,
    updateMeFromDB
};