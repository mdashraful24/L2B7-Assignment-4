import { Router } from "express";
import authProtected from "../../middlewares/authProtected";
import { UserRole } from "../../../generated/prisma/enums";
import { bookingController } from "./booking.controller";

const router = Router();

router.post("/", 
    authProtected(UserRole.CUSTOMER),
    bookingController.createBooking
);

router.get("/",
    authProtected(UserRole.CUSTOMER),
    bookingController.allBooking
);

router.get("/:id",
    authProtected(UserRole.CUSTOMER),
    bookingController.singleBookingDetails
);

router.patch("/:id",
    authProtected(UserRole.CUSTOMER),
    bookingController.updateBooking
);

router.patch("/status/:id",
    authProtected(UserRole.CUSTOMER),
    bookingController.updateBookingStatus
);


export const bookingRoutes = router;