import httpStatus from 'http-status';
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { IGoogleLoginPayload, ILoginUser, IUpdateMe, IUser } from "./auth.interface";
import config from "../../config";
import { SelfError } from "../../utils/errorResponse";
import { jwtUtils } from '../../utils/jwt';
import { JwtPayload, SignOptions } from 'jsonwebtoken';
import { TokenPayload } from 'google-auth-library';
import { googleClient } from '../../lib/googleAuth';
import { AuthProvider, UserRole, UserStatus } from '../../../generated/prisma/enums';

const registerUserIntoDB = async (payload: IUser) => {
    const { name, email, password, phone, role, address, bio, skills, experience, description, location } = payload;

    if (!name?.trim() || !email?.trim() || !password) {
        throw new SelfError("Name, email and password are required", httpStatus.BAD_REQUEST);
    }

    if (!role || !["CUSTOMER", "TECHNICIAN"].includes(role)) {
        throw new SelfError("Only CUSTOMER or TECHNICIAN registration is allowed", httpStatus.BAD_REQUEST);
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

    if (user.password === null && user.googleId !== null) {
        throw new Error(
            "User already registered with Google. Please try to login using Google.",
        );
    }

    const isPasswordMatched = await bcrypt.compare(
        password,
        user.password as string
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

const googleLoginIntoDB = async (payload: IGoogleLoginPayload) => {
    const { idToken, role } = payload;

    // Google login is only allowed for CUSTOMER and TECHNICIAN
    if (
        role !== UserRole.CUSTOMER &&
        role !== UserRole.TECHNICIAN
    ) {
        throw new SelfError("Google login is only available for customers and technicians", httpStatus.FORBIDDEN);
    }

    let googleIdTokenPayload: TokenPayload | undefined;

    // Verify Google ID token
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: config.google.clientId,
        });

        googleIdTokenPayload = ticket.getPayload();
    } catch (error) {
        // console.error("Google ID Token Verification Failed:", error);

        throw new SelfError("Invalid or expired Google ID token", httpStatus.UNAUTHORIZED);
    }

    if (!googleIdTokenPayload) {
        throw new SelfError("Invalid or expired Google ID token", httpStatus.UNAUTHORIZED);
    }

    if (!googleIdTokenPayload.sub) {
        throw new SelfError("Google ID not found", httpStatus.BAD_REQUEST);
    }

    if (!googleIdTokenPayload.email) {
        throw new SelfError("Google email not found", httpStatus.BAD_REQUEST);
    }

    if (!googleIdTokenPayload.name) {
        throw new SelfError("Google user name not found", httpStatus.BAD_REQUEST);
    }

    const googleId = googleIdTokenPayload.sub;
    const email = googleIdTokenPayload.email.toLowerCase();
    const name = googleIdTokenPayload.name;

    // First check Google ID
    let user = await prisma.user.findUnique({
        where: {
            googleId,
        },
        include: {
            technicianProfile: true,
        },
    });

    // Existing Google account
    if (user) {
        // Google account already belongs to another role
        if (user.role !== role) {
            throw new SelfError(
                // `This Google account is already registered as ${user.role.toLowerCase()}`,
                "This Google account is already registered. Please log in using your existing account or use a different Google account.",
                httpStatus.CONFLICT
            );
        }

        if (user.status === UserStatus.BANNED) {
            throw new SelfError("Your account has been Banned. Please contact support.", httpStatus.FORBIDDEN);
        }

        if (user.isDeleted) {
            throw new SelfError("Your account has been deleted.", httpStatus.FORBIDDEN);
        }
    }

    // Google ID doesn't exist
    if (!user) {
        // Find account using email
        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
            include: {
                technicianProfile: true,
            },
        });

        // Email already exists
        if (existingUser) {

            // Admin can NEVER use Google
            if (existingUser.role === UserRole.ADMIN) {
                throw new SelfError("Admin accounts cannot use Google authentication", httpStatus.FORBIDDEN);
            }

            // Don't allow same email to switch roles
            if (existingUser.role !== role) {
                throw new SelfError(
                    // `This email is already registered as ${existingUser.role.toLowerCase()}`,
                    "This email is already registered. Please log in using your existing account or use a different Google account.",
                    httpStatus.CONFLICT
                );
            }

            if (existingUser.status === UserStatus.BANNED) {
                throw new SelfError("Your account has been Banned. Please contact support.", httpStatus.FORBIDDEN);
            }

            if (existingUser.isDeleted) {
                throw new SelfError("Your account has been deleted.", httpStatus.FORBIDDEN);
            }

            // Existing credential account
            // Link Google authentication to it
            user = await prisma.user.update({
                where: {
                    id: existingUser.id,
                },
                data: {
                    googleId,
                    emailVerified: true,
                },
                include: {
                    technicianProfile: true,
                },
            });
        }

        // Completely new Google user
        else {
            if (role === UserRole.TECHNICIAN) {
                // Create user with technician profile
                // Make sure all required fields are provided
                user = await prisma.user.create({
                    data: {
                        name,
                        email,
                        googleId,
                        role: UserRole.TECHNICIAN,
                        authProvider: AuthProvider.GOOGLE,
                        emailVerified: true,
                        // Add default values for optional fields
                        needPasswordChange: false,
                        isDeleted: false,
                        status: UserStatus.ACTIVE,
                        // Create technician profile with ALL required fields
                        technicianProfile: {
                            create: {
                                bio: "",
                                skills: [],
                                experience: "",
                                description: "",
                                location: "",
                                rating: 0,
                                totalReviews: 0,
                            },
                        },
                    },
                    include: {
                        technicianProfile: true,
                    },
                });
            } else {
                // Create customer
                user = await prisma.user.create({
                    data: {
                        name,
                        email,
                        googleId,
                        role: UserRole.CUSTOMER,
                        authProvider: AuthProvider.GOOGLE,
                        emailVerified: true,
                        needPasswordChange: false,
                        isDeleted: false,
                        status: UserStatus.ACTIVE,
                    },
                    include: {
                        technicianProfile: true,
                    },
                });
            }
        }
    }

    // Final safety validation
    if (!user) {
        throw new SelfError("User not found or created", httpStatus.INTERNAL_SERVER_ERROR);
    }

    if (user.role === UserRole.ADMIN) {
        throw new SelfError("Admin accounts cannot use Google authentication", httpStatus.FORBIDDEN);
    }

    if (user.role !== UserRole.CUSTOMER && user.role !== UserRole.TECHNICIAN) {
        throw new SelfError("Invalid user role", httpStatus.FORBIDDEN);
    }

    if (user.status === UserStatus.BANNED) {
        throw new SelfError("Your account has been Banned. Please contact support.", httpStatus.FORBIDDEN);
    }

    if (user.isDeleted) {
        throw new SelfError("Your account has been deleted.", httpStatus.FORBIDDEN);
    }

    // JWT payload
    const jwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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

    return {
        accessToken,
        refreshToken,
    };
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
    googleLoginIntoDB,
    authRefreshTokenIntoDB,
    getMeFromDB,
    updateMeFromDB
};