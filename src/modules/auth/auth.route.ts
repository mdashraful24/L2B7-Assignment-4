import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();


router.post("/register", authController.registerUser);
router.post("/login", );
router.get("/me", );


export const authRoutes = router;