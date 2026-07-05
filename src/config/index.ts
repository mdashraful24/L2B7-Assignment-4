import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
    path: path.join(process.cwd(), ".env")
});

const config = {
    databaseUrl: process.env.DATABASE_URL,
    port: process.env.PORT,
    appUrl: process.env.APP_URL,

    security: {
        bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS,
    },

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET!,
        refreshSecret: process.env.JWT_REFRESH_SECRET!,
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN!,
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN!,
    },

    stripe: {
        productId: process.env.STRIPE_PRODUCT_PRICE_ID!,
        secretKey: process.env.STRIPE_SECRET_KEY!,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!
    }
};

export default config;