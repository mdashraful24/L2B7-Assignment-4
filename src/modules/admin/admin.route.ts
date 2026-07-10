import { Router } from "express";
import { adminController } from "./admin.controller";
import authProtected from "../../middlewares/authProtected";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();


// Categories
router.post("/categories",
    authProtected(UserRole.ADMIN),
    adminController.createServiceCategory
);

router.get("/categories",
    authProtected(UserRole.ADMIN),
    adminController.getAllServiceCategories
);

router.patch("/categories/:id",
    authProtected(UserRole.ADMIN),
    adminController.updateServiceCategories
);

// Users
router.get("/users",
    authProtected(UserRole.ADMIN),
    adminController.getAllUsers
);

router.patch("/users/:id",
    authProtected(UserRole.ADMIN),
    adminController.updateUserStatus
);

// Bookings
router.get("/bookings",
    authProtected(UserRole.ADMIN),
    adminController.getAllBookings
);


export const adminRoutes = router;