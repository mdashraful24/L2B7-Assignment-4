import httpStatus from 'http-status';
import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from "./config";
import { authRoutes } from "./modules/auth/auth.route";
import { sendResponse } from "./utils/sendResponse";
import globalErrorHandler from './middlewares/globalErrorHandler';
import { routeNotFound } from './middlewares/routeNotFound';
import { technicianRoutes } from './modules/technician/tech.route';
import { serviceRoutes } from './modules/service/service.route';
import { categoryRoutes } from './modules/category/category.route';
import { adminRoutes } from './modules/admin/admin.route';
import { bookingRoutes } from './modules/booking/booking.route';
import { reviewRoutes } from './modules/review/review.route';
import { paymentRoutes } from './modules/payment/payment.route';

const app: Application = express();

// Middlewares
app.use(cors({
    origin: config.appUrl,
    credentials: true
}));

app.post("/api/payments/webhook", express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Default Route
app.get("/", (req: Request, res: Response) => {
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Welcome to the FixItNow API. The server is running successfully.",
        data: {
            status: "Healthy",
            author: config.projectAuthor,
        },
    });
});

// All Business Routes
app.use("/api/auth/", authRoutes);
app.use("/api/technicians", technicianRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);


// Route Not Found
app.use(routeNotFound);

// Global Error Handling Middleware
app.use(globalErrorHandler);


export default app;