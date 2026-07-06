import { Router } from "express";
import { technicianController } from "./tech.controller";
import authProtected from "../../middlewares/authProtected";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();


router.get("/", technicianController.allTechnician);

router.get("/:id", technicianController.singleTechnician);

router.put("/profile",
    authProtected(UserRole.TECHNICIAN),
    technicianController.updateTechProfile
);

router.post("/availability",
    authProtected(UserRole.TECHNICIAN),
    technicianController.createAvailabilitySlot
);

router.put("/availability",
    authProtected(UserRole.TECHNICIAN),
    technicianController.updateAvailabilitySlot
)

router.get("/bookings",
    authProtected(UserRole.TECHNICIAN),
    technicianController.techniciansBookings
)

router.get("/bookings/:id",
    authProtected(UserRole.TECHNICIAN),
    technicianController.updateBookingStatus
)



export const technicianRoutes = router;