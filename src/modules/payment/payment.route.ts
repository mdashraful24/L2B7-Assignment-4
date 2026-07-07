import { Router } from "express";
import { paymentController } from "./payment.controller";
import { UserRole } from "../../../generated/prisma/enums";
import authProtected from "../../middlewares/authProtected";

const router = Router();


router.post("/create",
    authProtected(UserRole.CUSTOMER),
    paymentController.createIntent
);

router.post("/confirm",
    authProtected(UserRole.CUSTOMER),
    paymentController.paymentConfirm
);

router.post("/webhook",
    paymentController.stripeWebhook
);

router.get("",
    authProtected(UserRole.CUSTOMER),
    paymentController.paymentHistory
);

router.get("/:id",
    authProtected(UserRole.CUSTOMER),
    paymentController.paymentDetails
);



export const paymentRoutes = router;