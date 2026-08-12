import { Router } from "express";
import { contactController } from "./contact.controller";
import authProtected from "../../middlewares/authProtected";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post("/", contactController.createContact);

router.get("/",
    authProtected(UserRole.ADMIN),
    contactController.allContacts
);

router.get("/:id",
    authProtected(UserRole.ADMIN),
    contactController.singleContact
);

export const contactRoutes = router;
