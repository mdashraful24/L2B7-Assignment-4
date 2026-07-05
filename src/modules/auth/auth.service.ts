import httpStatus from 'http-status';
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { ILoginUser, IUser } from "./auth.interface";
import config from "../../config";
import { SelfError } from "../../utils/errorResponse";
import { jwtUtils } from '../../utils/jwt';
import { JwtPayload, SignOptions } from 'jsonwebtoken';

const registerUserIntoDB = async (payload: IUser) => {
    const { name, email, password, phone, role, address } = payload;

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

    const createUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashPassword,
            phone,
            role,
            address,
        }
    });

    const user = await prisma.user.findUnique({
        where: {
            id: createUser.id,
            email: createUser.email || email
        },
        omit: {
            password: true
        },
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
    });

    return user;
};


export const authService = {
    registerUserIntoDB,
    loginUserIntoDB,
    authRefreshTokenIntoDB,
    getMeFromDB
};