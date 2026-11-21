import bcrypt from "bcryptjs";
import { UserRole } from "../../generated/prisma/client";
import config from "../config";
import { prisma } from "../lib/prisma";
import logger from "../logger";

const categoryData = [
    {
        name: "Plumbing",
        description: "Pipe repairs, leak detection, and installation of taps, sinks, and fixtures.",
    },
    {
        name: "Electrical",
        description: "Wiring, lighting, socket repairs, and electrical safety inspections.",
    },
    {
        name: "Cleaning",
        description: "Home deep cleaning, carpet care, and kitchen or bathroom sanitation.",
    },
    {
        name: "Cooling & heating",
        description: "AC servicing, repair, and heating system maintenance.",
    },
    {
        name: "Appliance repair",
        description: "Diagnosis and repair of washing machines, refrigerators, and kitchen appliances.",
    },
    {
        name: "Carpentry",
        description: "Furniture assembly, door and window repairs, and custom woodwork.",
    },
    {
        name: "Security",
        description: "CCTV installation, access control, and home security system setup.",
    },
    {
        name: "Pest control",
        description: "Safe pest inspection and treatment for residential spaces.",
    },
];

const serviceData = [
    {
        categoryName: "Plumbing",
        title: "Leak detection & repair",
        description: "Locate and repair leaking pipes, joints, and taps with minimal disruption.",
        price: 65,
        hourlyRate: 35,
        duration: 60,
    },
    {
        categoryName: "Plumbing",
        title: "Faucet & fixture installation",
        description: "Supply and fit new faucets, sinks, showers, and other bathroom fixtures.",
        price: 55,
        hourlyRate: 35,
        duration: 45,
    },
    {
        categoryName: "Electrical",
        title: "Electrical fault diagnosis",
        description: "Inspect wiring and circuits, identify faults, and restore safe operation.",
        price: 70,
        hourlyRate: 40,
        duration: 60,
    },
    {
        categoryName: "Electrical",
        title: "Lighting & fan installation",
        description: "Install or replace lights, ceiling fans, switches, and sockets.",
        price: 50,
        hourlyRate: 40,
        duration: 45,
    },
    {
        categoryName: "Cleaning",
        title: "Home deep cleaning",
        description: "Thorough cleaning of living areas, floors, kitchens, and bathrooms.",
        price: 120,
        hourlyRate: 30,
        duration: 180,
    },
    {
        categoryName: "Cleaning",
        title: "Kitchen & bathroom cleaning",
        description: "Degreasing, descaling, and sanitizing high-use kitchen and bathroom areas.",
        price: 65,
        hourlyRate: 30,
        duration: 90,
    },
    {
        categoryName: "Cooling & heating",
        title: "AC maintenance & servicing",
        description: "Filter cleaning, coil checks, and performance tuning for split and window units.",
        price: 89,
        hourlyRate: 45,
        duration: 90,
    },
    {
        categoryName: "Cooling & heating",
        title: "AC gas refill & repair",
        description: "Diagnose cooling issues, repair components, and top up refrigerant safely.",
        price: 110,
        hourlyRate: 45,
        duration: 90,
    },
    {
        categoryName: "Appliance repair",
        title: "Washing machine repair",
        description: "Troubleshoot drainage, spin, and motor problems for top and front load machines.",
        price: 75,
        hourlyRate: 40,
        duration: 90,
    },
    {
        categoryName: "Appliance repair",
        title: "Refrigerator repair",
        description: "Fix cooling, thermostat, and compressor issues for household refrigerators.",
        price: 80,
        hourlyRate: 40,
        duration: 90,
    },
    {
        categoryName: "Carpentry",
        title: "Furniture assembly",
        description: "Assemble flat-pack furniture, shelves, and storage units at your home.",
        price: 55,
        hourlyRate: 30,
        duration: 90,
    },
    {
        categoryName: "Carpentry",
        title: "Door & window repair",
        description: "Repair hinges, locks, frames, and misfitting doors or windows.",
        price: 60,
        hourlyRate: 30,
        duration: 60,
    },
    {
        categoryName: "Security",
        title: "CCTV camera installation",
        description: "Install and configure indoor and outdoor cameras with mobile viewing.",
        price: 150,
        hourlyRate: 50,
        duration: 180,
    },
    {
        categoryName: "Pest control",
        title: "Residential pest treatment",
        description: "Inspect and treat common household pests using safe, approved methods.",
        price: 95,
        hourlyRate: 35,
        duration: 120,
    },
];

export const seedCategories = async () => {
    for (const category of categoryData) {
        await prisma.category.upsert({
            where: { name: category.name },
            update: {
                description: category.description,
                isActive: true,
            },
            create: {
                ...category,
                isActive: true,
            },
        });
    }

    logger.info(`Seeded ${categoryData.length} categories.`);
};

export const seedDemoTechnician = async () => {
    const existingUser = await prisma.user.findUnique({
        where: { email: config.seed.technicianEmail },
    });

    if (existingUser) {
        logger.info("Demo technician already exists.");
        return;
    }

    const hashedPassword = await bcrypt.hash(
        config.seed.technicianPassword,
        Number(config.security.bcryptSaltRounds) || 10,
    );

    await prisma.user.create({
        data: {
            name: config.seed.technicianName,
            email: config.seed.technicianEmail,
            password: hashedPassword,
            role: UserRole.TECHNICIAN,
            emailVerified: true,
            needPasswordChange: false,
            technicianProfile: {
                create: {
                    bio: "Verified home-service specialist with years of hands-on experience.",
                    skills: ["Plumbing", "Electrical", "AC Repair", "Cleaning", "Carpentry"],
                    experience: "8 years",
                    description: "Handles a wide range of home repair and maintenance jobs.",
                    location: "Dhaka",
                },
            },
        },
    });

    logger.info("Demo technician created.");
};

export const seedServices = async () => {
    const technician = await prisma.technicianProfile.findFirst({
        where: { user: { email: config.seed.technicianEmail } },
    });

    if (!technician) {
        logger.info("Demo technician not found, skipping service seed.");
        return;
    }

    let seededCount = 0;

    for (const service of serviceData) {
        const category = await prisma.category.findUnique({
            where: { name: service.categoryName },
        });

        if (!category) {
            logger.warn(`Category not found for service "${service.title}", skipping.`);
            continue;
        }

        const existingService = await prisma.service.findFirst({
            where: {
                title: service.title,
                categoryId: category.id,
                technicianId: technician.id,
            },
        });

        if (existingService) {
            continue;
        }

        await prisma.service.create({
            data: {
                title: service.title,
                description: service.description,
                price: service.price,
                hourlyRate: service.hourlyRate,
                duration: service.duration,
                categoryId: category.id,
                technicianId: technician.id,
                isAvailable: true,
            },
        });

        seededCount += 1;
    }

    logger.info(`Seeded ${seededCount} services.`);
};

export const seed = async () => {
    await seedCategories();
    await seedDemoTechnician();
    await seedServices();
};
