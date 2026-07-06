import { Router } from "express";
import { reviewController } from "./review.controller";
import authProtected from "../../middlewares/authProtected";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();


router.post("/",
    authProtected(UserRole.CUSTOMER),
    reviewController.createReview
);


export const reviewRoutes = router;