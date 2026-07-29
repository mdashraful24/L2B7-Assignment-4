import { Router } from "express";
import { serviceController } from "./service.controller";
import authProtected from "../../middlewares/authProtected";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();


router.post("/",
    authProtected(UserRole.TECHNICIAN),
    serviceController.createService
);

// Public
router.get("/", serviceController.allServicesWithFilter);

// Private
router.get("/my-services",
    authProtected(UserRole.TECHNICIAN),
    serviceController.myServices
)

router.get("/:id", serviceController.singleService);

router.patch("/:id",
    authProtected(UserRole.TECHNICIAN),
    serviceController.updatedService
);


export const serviceRoutes = router;