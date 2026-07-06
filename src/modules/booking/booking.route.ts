import { Router } from "express";
import authProtected from "../../middlewares/authProtected";
import { UserRole } from "../../../generated/prisma/enums";
import { bookingController } from "./booking.controller";

const router = Router();


router.post("/", 
    authProtected(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN),
    bookingController.createBooking
);

router.get("/",
    authProtected(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN),
    bookingController.allBooking
);

router.get("/:id",
    authProtected(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN),
    bookingController.singleBookingDetails
);

router.patch("/:id",
    authProtected(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN),
    bookingController.updateBooking
);

router.delete("/:id",
    authProtected(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN),
    bookingController.deleteBooking
);


export const bookingRoutes = router;