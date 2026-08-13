import { Router } from "express";
import { contactController } from "./contact.controller";
import authProtected from "../../middlewares/authProtected";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post(
    "/",
    authProtected(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN),
    contactController.createContact
);

router.get(
    "/my-contacts",
    authProtected(UserRole.CUSTOMER, UserRole.TECHNICIAN),
    contactController.myContacts
);

router.get(
    "/",
    authProtected(UserRole.ADMIN),
    contactController.allContacts
);

router.get(
    "/:id",
    authProtected(UserRole.ADMIN),
    contactController.singleContact
);

router.patch(
    "/:id/reply",
    authProtected(UserRole.ADMIN),
    contactController.replyContact
);

export const contactRoutes = router;
