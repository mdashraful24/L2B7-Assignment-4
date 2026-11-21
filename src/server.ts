import app from "./app";
import config from "./config";
import logger from "./logger";
import { prisma } from "./lib/prisma";
import { cloudinary } from "./lib/cloudinary";
import { seed } from "./utils/seed";

// Project running port
const PORT = config.port;

async function main() {
    try {
        await prisma.$connect();
        logger.info("Connected to the database successfully.");

        // const seeded = await seed();
        // if (seeded) {
        //     logger.info("Database seeding completed.");
        // }

        await cloudinary.api.ping();
        logger.info("Cloudinary configured successfully.");

        app.listen(PORT, () => {
            logger.info(`Server is running on port http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error("Error starting server:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

if (!process.env.VERCEL) {
    main();
}

export default app;
