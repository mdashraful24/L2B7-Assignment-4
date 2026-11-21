import { Router } from "express";
import { authController } from "./auth.controller";
import authProtected from "../../middlewares/authProtected";
import { UserRole } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";

const router = Router();


router.post("/register", authController.registerUser);

router.post("/login", authController.loginUser);

router.post("/google-login", authController.googleLogin);

router.post("/refresh-token", authController.authRefreshToken);

router.get("/me",
    authProtected(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN),
    authController.getMe
);

router.put("/update/me",
    authProtected(UserRole.CUSTOMER, UserRole.ADMIN),
    authController.updateMe
);

router.patch("/upload-profile-picture",
    authProtected(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN),
    upload.single("profilePicture"),
    authController.uploadProfilePicture
);


export const authRoutes = router;