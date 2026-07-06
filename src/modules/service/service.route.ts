import { Router } from "express";
import { serviceController } from "./service.controller";
import authProtected from "../../middlewares/authProtected";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();


router.post("/", authProtected(UserRole.TECHNICIAN), serviceController.createService);
router.get("/", serviceController.allServicesWithFilter);
router.get("/:id", serviceController.singleService);

export const serviceRoutes = router;