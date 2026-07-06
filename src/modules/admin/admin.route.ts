import { Router } from "express";
import { adminController } from "./admin.controller";
import authProtected from "../../middlewares/authProtected";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

// Users
router.get("/users", authProtected(UserRole.ADMIN), adminController.getAllUsers);
router.patch("/users/:id", authProtected(UserRole.ADMIN), adminController.updateUserStatus);

// Bookings
router.get("/bookings", authProtected(UserRole.ADMIN), adminController.getAllBookings);

// Categories
router.get("/categories", authProtected(UserRole.ADMIN), adminController.getAllCategories);
router.post("/categories", authProtected(UserRole.ADMIN), adminController.createServiceCategory);

export const adminRoutes = router;