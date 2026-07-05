import { Router } from "express";
import { authController } from "./auth.controller";
import authProtected from "../../middlewares/authProtected";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();


router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/refresh-token", authController.authRefreshToken);
router.get("/me",
    authProtected(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN),
    authController.getMe
);


export const authRoutes = router;